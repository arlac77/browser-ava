import { testModules } from "./ava.mjs";

let ws = new WebSocket(`ws://${location.host}`);
ws.onerror = console.error;

ws.onmessage = async message => {
  const data = JSON.parse(message.data);
  switch (data.action) {
    case "load": {
      testModules.length = 0;
      for (const tm of data.data) {
        tm.tests = [];
        testModules.push(tm);
        await import(new URL(tm.url, import.meta.url));
      }

      displayTests();
      ws.send(JSON.stringify({ action: "ready" }));
    }
    case "run": {
      await runTestModules();
    }
  }
};

async function displayTests() {
  const run = document.getElementById("run");
  run.onclick = runTestModules;

  function renderTest(t) {
    return `<li class="${
      t.passed === true ? "passed" : t.passed === false ? "failed" : ""
    }">${t.title} <span>${
      t.assertions
        ? t.assertions
            .filter(a => !a.passed)
            .map(a => a.title + " " + a.message)
            .join(" ")
        : ""
    }</span>${t.message ? t.message : ""}</li>`;
  }

  function renderModule(tm) {
    return `<li id="${tm.file}">${tm.file}<ul>${tm.tests
      .map(renderTest)
      .join("\n")}</ul></li>`;
  }

  const tests = document.getElementById("tests");

  tests.innerHTML = "<ul>" + testModules.map(renderModule).join("\n") + "</ul>";
}

async function runTest(test) {
  if (!test.skip && !test.todo) {
    const t = testContext(test);

    try {
      await test.body(t, ...test.args);

      if (test.assertions.length === 0) {
        test.passed = false;
        test.message = "Test finished without running any assertions";
      } else {
        test.passed = !test.assertions.find(a => a.passed !== true);

        if (t.planned !== undefined && t.planned !== test.assertions.length) {
          test.passed = false;
          test.message = `Planned for ${t.planned} assertions, but got ${test.assertions.length}`;
        }
      }
    } catch (e) {
      test.passed = false;
      test.message = e;
    }
  }
}

/**
 * run serial tests before all others
 */
async function runTestModule(tm) {
  for (const test of tm.tests.filter(test => test.serial)) {
    await runTest(test);
  }

  await Promise.all(
    tm.tests.filter(test => !test.serial).map(test => runTest(test))
  );
}

async function runTestModules() {
  await Promise.all(testModules.map(tm=>runTestModule(tm)));

  ws.send(JSON.stringify({ action: "result", data: testModules }));

  displayTests();
}

function testContext(def) {
  def.assertions = [];

  return {
    teardowns: [],
    logs: [],
    title: def.title,
    context: {},

    log(...args) {
      this.logs.push(args);
    },
    plan(count) {
      this.planned = count;
    },
    teardown(fn) {
      this.teardowns.push(fn);
    },
    timeout(ms) {},

    // assertions
    pass(title) {
      def.assertions.push({ passed: true, title });
    },
    fail(title) {
      def.assertions.push({ passed: false, title });
    },

    throws(a, title) {},
    deepEqual(a, b, title) {
      def.assertions.push({ passed: a === b, message, title });
    },
    is(a, b, title) {
      def.assertions.push({
        passed: Object.is(a, b),
        message: `${a} != ${b}`,
        title
      });
    },
    true(value, title) {
      def.assertions.push({
        passed: value === true,
        message: `${value} != true`,
        title
      });
    },
    false(value, title) {
      def.assertions.push({
        passed: value === false,
        message: `${value} != false`,
        title
      });
    }
  };
}

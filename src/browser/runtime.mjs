import { world } from "ava";

let ws = new WebSocket(`ws://${location.host}`);
ws.onerror = console.error;


ws.onmessage = async message => {
  const data = JSON.parse(message.data);
  switch (data.action) {
    case "load": {
      for (const file of data.data) {
        world.current = { file, tests: [] };
        world.files.push(world.current);
        await import(new URL(file, import.meta.url));
      }

      displayTests();
      ws.send(JSON.stringify({ action: "ready" }));
    }
    case "run": {
      await runTests();
    }
  }
};

async function displayTests() {
  const run = document.getElementById("run");
  run.onclick = runTests;

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

  function renderFile(f) {
    return `<li id="${f.file}">${f.file}<ul>${f.tests
      .map(renderTest)
      .join("\n")}</ul></li>`;
  }

  const tests = document.getElementById("tests");

  tests.innerHTML = "<ul>" + world.files.map(renderFile).join("\n") + "</ul>";
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
async function runTests() {
  for (const f of world.files) {
    for (const test of f.tests.filter(test => test.serial)) {
      await runTest(test);
    }

    await Promise.all(
      f.tests.filter(test => !test.serial).map(test => runTest(test))
    );
  }

  ws.send(JSON.stringify({ action: "result", data: world.files }));

  displayTests();
}

function testContext(def) {
  const title = def.title;
  def.assertions = [];

  return {
    teardowns: [],
    logs: [],
    title,
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

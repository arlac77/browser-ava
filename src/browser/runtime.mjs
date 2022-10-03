import { testModules } from "./ava.mjs";
import { calculateSummary, summaryMessages } from "./util.mjs";
import { isEqual } from "./eql.mjs";

let ws = new WebSocket(`ws://${location.host}`);
ws.onerror = console.error;

ws.onmessage = async message => {
  const data = JSON.parse(message.data);
  switch (data.action) {
    case "load":
      {
        testModules.length = 0;
        let errors = 0;
        for (const tm of data.data) {
          tm.logs = [];
          tm.tests = [];
          tm.before = [];
          tm.after = [];
          tm.beforeEach = [];
          tm.afterEach = [];
          testModules.push(tm);
          try {
            await import(new URL(tm.url, import.meta.url));
          } catch (e) {
            errors++;
            console.error(e);
            tm.logs.push(`error importing ${tm.url} ${e}`);
            ws.send(JSON.stringify({ action: "error", data: e }));
          }
        }

        displayTests();
        if(errors === 0) {
          ws.send(JSON.stringify({ action: "ready" }));
        }
      }
      break;
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
      t.passed === true
        ? "passed"
        : t.passed === false
        ? "failed"
        : t.todo
        ? "todo"
        : ""
    }">${t.title} <span>${
      t.assertions
        ? t.assertions
            .filter(a => !a.passed)
            .map(a => (a.title || "") + " " + (a.message || ""))
            .join(" ")
        : ""
    }</span>${t.message ? t.message : ""}</li>`;
  }

  function renderModule(tm) {
    return `<li id="${tm.file}">${tm.file}<br/>${tm.logs.join('<br/>')}<ul>${tm.tests
      .map(renderTest)
      .join("\n")}</ul></li>`;
  }

  const tests = document.getElementById("tests");
  tests.innerHTML = "<ul>" + testModules.map(renderModule).join("\n") + "</ul>";

  document.getElementById("summary").innerHTML = summaryMessages(
    calculateSummary(testModules)
  ).join("<br/>");
}

async function execHooks(hooks, t) {
  if (hooks.length > 0) {
    await Promise.all(
      hooks.map(async h => {
        h.args[typeof h.args[0] === "string" ? 1 : 0](t);
      })
    );
  }
}

async function runTest(parent, tm, test) {
  if (!test.skip && !test.todo) {
    const t = testContext(test, parent);

    try {
      await execHooks(tm.beforeEach, t);

      await test.body(t, ...test.args);

      await execHooks(tm.afterEach, t);

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
  tm.logs = [];

  const t = {
    context: {},
    log(...args) {
      tm.logs.push(args);
    }
  };

  await execHooks(tm.before, t);

  for (const test of tm.tests.filter(test => test.serial)) {
    await runTest(t, tm, test);
  }

  await Promise.all(
    tm.tests.filter(test => !test.serial).map(test => runTest(t, tm, test))
  );

  await execHooks(tm.after, t);
}

async function runTestModules() {
  await Promise.all(testModules.map(tm => runTestModule(tm)));

  ws.send(JSON.stringify({ action: "result", data: testModules }));

  displayTests();
}

function testContext(def, parentContext) {
  def.assertions = [];
  def.logs = [];

  function throwsExpectationHandler(e, expectation, title) {
    if (expectation !== undefined) {
      for (const slot of ["name", "code", "is"]) {
        if (expectation[slot] !== undefined) {
          if (expectation[slot] !== e[slot]) {
            def.assertions.push({
              passed: false,
              message: `expected ${slot}=${expectation[slot]} but got ${e[slot]}`,
              title
            });
            return false;
          }
        }
      }
      if (expectation.message !== undefined) {
        const slot = "message";
        if (expectation.message instanceof RegExp) {
          if (!expectation.message.test(e.message)) {
            def.assertions.push({
              passed: false,
              message: `${slot} does not match ${expectation[slot]}`,
              title
            });
            return false;
          }
        }

        if (typeof expectation.message === "string") {
          if (expectation[slot] !== e[slot]) {
            def.assertions.push({
              passed: false,
              message: `expected ${slot}=${expectation[slot]} but got ${e[slot]}`,
              title
            });
            return false;
          }
        }
      }
    }

    return true;
  }

  const assertions = {
    pass(title) {
      def.assertions.push({ passed: true, title });
    },
    fail(title) {
      def.assertions.push({
        passed: false,
        title,
        message: "Test failed via `t.fail()`"
      });
    },

    async throwsAsync(a, expectation, title) {
      try {
        await a();
        def.assertions.push({
          passed: false,
          title,
          message: "Expected exception to be thrown"
        });
      } catch (e) {
        if (throwsExpectationHandler(expectation, title)) {
          def.assertions.push({ passed: true, title });
        }
      }
    },

    throws(a, expectation, title) {
      try {
        a();
        def.assertions.push({
          passed: false,
          title,
          message: "Expected exception to be thrown"
        });
      } catch (e) {
        if (throwsExpectationHandler(expectation, title)) {
          def.assertions.push({ passed: true, title });
        }
      }
    },
    deepEqual(a, b, title) {
      def.assertions.push({
        passed: isEqual(a, b),
        message: `${a} != ${b}`,
        title
      });
    },
    is(a, b, title) {
      def.assertions.push({
        passed: Object.is(a, b),
        message: `${a} != ${b}`,
        title
      });
    },
    not(a, b, title) {
      def.assertions.push({
        passed: !Object.is(a, b),
        message: `${a} = ${b}`,
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
    truthy(value, title) {
      def.assertions.push({
        passed: value ? true : false,
        message: `${value} is not truthy`,
        title
      });
    },
    false(value, title) {
      def.assertions.push({
        passed: value === false,
        message: `${value} != false`,
        title
      });
    },
    falsy(value, title) {
      def.assertions.push({
        passed: value ? false : true,
        message: `${value} is not falsy`,
        title
      });
    }
  };

  const skippableAssertions = Object.fromEntries(
    Object.keys(assertions).map(name => [
      `${name}.skip`,
      () => def.assertions.push({ skipped: true })
    ])
  );

  return {
    ...assertions,
    ...skippableAssertions,
    ...parentContext,
    teardowns: [],
    title: def.title,
    log(...args) {
      def.logs.push(args);
    },

    plan(count) {
      this.planned = count;
    },
    teardown(fn) {
      this.teardowns.push(fn);
    },
    timeout(ms) {}
  };
}

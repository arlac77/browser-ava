import { testModules, test } from "./ava.mjs";
import {
  calculateSummary,
  summaryMessages,
  pluralize,
  moduleName
} from "./util.mjs";
import { isEqual } from "./assertions.mjs";

let ws = new WebSocket(`ws://${location.host}`);
ws.onerror = console.error;

function primitiveRoString() {
  return this.toString();
}
BigInt.prototype.toJSON = primitiveRoString;
Error.prototype.toJSON = primitiveRoString;

function allErrorProperties(key, value) {
  if (value instanceof Error) {
      const error = {};
      Object.
        getOwnPropertyNames(value).
        forEach((key) => error[key] = value[key]);
      return error;
  }
  return value;
}

/*
 forward console info,log,error to the server
 */
for (const action of ["log", "info", "error"]) {
  const former = console[action];

  console[action] = (...data) => {
    if (ws) {
      ws.send(JSON.stringify({ action, data }, allErrorProperties));
    }
    former(...data);
  };
}

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
            console.error(e.toString());
            tm.logs.push(`error importing ${tm.url} ${e}`);
          }
        }

        displayTests();
        if (errors === 0) {
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
  function renderTest(t) {
    return `<li class="test ${
      t.passed === true
        ? "passed"
        : t.passed === false
        ? "failed"
        : t.skip
        ? "skip"
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
    }</span>${t.message ? t.message : ""}${t.stack ? "<br>" + t.stack : ""}</li>`;
  }

  function renderModule(tm) {
    const passedTestsCount = tm.tests.filter(t => t.passed).length;
    const allTestsCount = tm.tests.length;
    return `<li id="${moduleName(tm.file)}" class="module${
      passedTestsCount === allTestsCount ? " passed" : ""
    }">
      <span class="moduleName">${moduleName(tm.file)}</span>
      <span class="moduleSummary"> ( ${passedTestsCount} / ${allTestsCount} ${pluralize(
      "test",
      allTestsCount
    )} passed )</span>
      <div class="logs">${tm.logs.join("<br/>")}</div>
      <ul>${tm.tests.map(renderTest).join("\n")}</ul>
      </li>`;
  }

  const tests = document.getElementById("tests");
  tests.innerHTML = `<ul class="wrapper"><li>
      <span class="all module">ALL TESTS</span>
      <ul class="allTests">${testModules.map(renderModule).join("\n")}</ul>
      </li></ul>`;

  tests.querySelectorAll(".module").forEach(elem => {
    elem.onclick = switchPassed;
    manualSwitchPassed(elem);
  });
  function switchPassed() {
    manualSwitchPassed(this);
    console.log(this);
  }
  function manualSwitchPassed(elem) {
    elem.classList.toggle("hidePassed");
  }

  document.getElementById("summary").innerHTML = summaryMessages(
    calculateSummary(testModules)
  )
    .map(m => m.html)
    .join("");
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

async function runTest(parent, tm, testInstance) {
  test.meta.file = tm.file;

  if (!testInstance.skip && !testInstance.todo) {
    const t = testContext(testInstance, parent);

    try {
      await execHooks(tm.beforeEach, t);

      if (t.ms) {
        t.timer = setTimeout(() => {
          t.passed = false;
          t.log("Test timeout exceeded");
        }, t.ms);
      }

      await testInstance.body(t, ...testInstance.args);

      if (t.timer) {
        clearTimeout(t.timer);
        delete t.timer;
      }

      for (const td of t.teardowns.reverse()) {
        await td();
      }

      await execHooks(tm.afterEach, t);

      if (testInstance.assertions.length === 0) {
        testInstance.passed = false;
        testInstance.message = "Test finished without running any assertions";
      } else {
        testInstance.passed = !testInstance.assertions.find(
          a => a.passed !== true && !a.skipped
        );

        if (
          t.planned !== undefined &&
          t.planned !== testInstance.assertions.length
        ) {
          testInstance.passed = false;
          testInstance.message = `Planned for ${t.planned} assertions, but got ${testInstance.assertions.length}`;
        }
      }
    } catch (e) {
      testInstance.passed = false;
      testInstance.message = e;
      testInstance.stack = e.stack;
    } finally {
      ws.send(JSON.stringify({ action: "update", data: testInstance }, allErrorProperties));
    }
  }
}

const runButton = document.getElementById("run");

/**
 * run serial tests before all others
 */
async function runTestModule(tm) {
  runButton.classList.add("running");

  try {
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
  } finally {
    runButton.classList.remove("running");
  }
}

async function runTestModules() {
  await Promise.all(testModules.map(tm => runTestModule(tm)));

  ws.send(JSON.stringify({ action: "result", data: testModules }, allErrorProperties));

  displayTests();
}

runButton.onclick = runTestModules;

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
            return;
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
            return;
          }
        }

        if (typeof expectation.message === "string") {
          if (expectation[slot] !== e[slot]) {
            def.assertions.push({
              passed: false,
              message: `expected ${slot}=${expectation[slot]} but got ${e[slot]}`,
              title
            });
            return;
          }
        }
      }
    }

    def.assertions.push({ passed: true, title });
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

    throws(a, expectation, title) {
      try {
        a();
        def.assertions.push({
          passed: false,
          title,
          message: "Expected exception to be thrown"
        });
      } catch (e) {
        throwsExpectationHandler(e, expectation, title);
        return e;
      }
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
        throwsExpectationHandler(e, expectation, title);
        return e;
      }
    },

    notThrows(a, title) {
      try {
        a();
      } catch (e) {
        def.assertions.push({
          passed: false,
          title,
          message: `Unexpected exception ${e}`
        });
      }
    },

    async notThrowsAsync(a, title) {
      try {
        await a();
      } catch (e) {
        def.assertions.push({
          passed: false,
          title,
          message: `Unexpected exception ${e}`
        });
      }
    },

    deepEqual(a, b, title) {
      def.assertions.push({
        passed: isEqual(a, b),
        message: `${a} != ${b}`,
        title
      });
    },
    notDeepEqual(a, b, title) {
      def.assertions.push({
        passed: !isEqual(a, b),
        message: `${a} = ${b}`,
        title
      });
    },
    like(a, b, title) {
      def.assertions.push({
        passed: isEqual(a, b), // todo
        message: `${a} != ${b}`,
        title
      });
    },

    regex(contents, regex, message) {
      def.assertions.push({
        passed: contents.match(regex) ? true : false,
        message: `${contents} matches ${regex}`
      });
    },
    notRegex(contents, regex, message) {
      def.assertions.push({
        passed: contents.match(regex) ? false : true,
        message: `${contents} matches ${regex}`
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

  Object.values(assertions).forEach(
    assertion => (assertion.skip = () => def.assertions.push({ skipped: true }))
  );

  return {
    ...assertions,
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
    timeout(ms) {
      this.ms = ms;
    }
  };
}

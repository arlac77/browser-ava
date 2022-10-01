import { world } from "ava";

async function loadTests() {
  const response = await fetch("tests.json");

  for (const file of await response.json()) {
    world.current = world.files[file] = { file, tests: [] };
    await import(new URL(file, import.meta.url));
  }
}

async function displayTests() {
  const run = document.getElementById("run");
  run.onclick = async () => {
    await runTests();
    displayTests();
  };

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
    }</span></li>`;
  }

  function renderFile(f, def) {
    return `<li id="${f}">${f}<ul>${def.tests
      .map(renderTest)
      .join("\n")}</ul></li>`;
  }

  const tests = document.getElementById("tests");

  tests.innerHTML =
    "<ul>" +
    Object.entries(world.files)
      .map(([f, def]) => renderFile(f, def))
      .join("\n") +
    "</ul>";
}

async function runTests() {
  for (const [file, def] of Object.entries(world.files)) {
    for (const test of def.tests) {
      if (!test.skip) {
        const t = testContext(test);

        try {
          await test.body(t, ...test.args);
          test.passed = !test.assertions.find(a => a.passed !== true);
        } catch (e) {
          test.passed = false;
        }
      }
    }
  }
}

loadTests().then(() => displayTests());

function testContext(def) {
  const title = def.title;
  def.assertions = [];
  
  return {
    title,
    context: {},
    log(...args) {},
    plan(count) {},
    teardown(fn) {},
    timeout(ms) {},

    
    // assertions

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

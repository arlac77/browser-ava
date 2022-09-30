import { world, textContext } from "ava";

async function loadTests() {
  const response = await fetch("test-files.json");

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

  const tests = document.getElementById("tests");

  function slot(f, def) {
    return (
      `<li id="${f}">${f}<ul>` +
      def.tests
        .map(
          t =>
            `<li>${t.name} <span>${
              t.ok === true ? "green" : t.ok === false ? "red" : "?"
            } ${t.assertions
              .filter(a => !a.ok)
              .map(a => a.name + " " + a.message)
              .join(" ")}</span></li>`
        )
        .join("\n") +
      "</ul></li>"
    );
  }

  tests.innerHTML =
    "<ul>" +
    Object.entries(world.files)
      .map(([f, def]) => slot(f, def))
      .join("\n") +
    "</ul>";
}

async function runTests() {
  for (const [file, def] of Object.entries(world.files)) {
    for (const test of def.tests) {
      const t = textContext(test);

      try {
        await test.body(t);
        test.ok = !test.assertions.find(a => a.ok !== true);
      } catch (e) {
        test.ok = false;
      }
    }
  }
}

loadTests().then(() => displayTests());

import { world, textContext } from "ava";

async function loadTests() {
  const response = await fetch("test-files.json");

  for (const file of await response.json()) {
    const current = { file, tests: [] };

    world.files[file] = current;
    world.current = current;

    await import(new URL(file, import.meta.url));
  }
}

async function displayTests() {
  const run = document.getElementById("run");
  run.onclick = runTests;

  const tests = document.getElementById("tests");

  function slot(f, def) {
    return (
      `<li id="${f}">${f}<ul>` +
      def.tests.map(t => `<li>${t.name}</li>`).join("\n") +
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
      console.log("run", file, test.name);
      const t = textContext(test);
      await test.body(t);
    }
  }
}

loadTests().then(() => displayTests());

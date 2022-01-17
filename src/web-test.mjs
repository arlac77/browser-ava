const tests = document.getElementById("tests");

async function setupTests() {
  const response = await fetch("test-files.json");
  const testFiles = await response.json();
  tests.innerHTML =
    "<ul>" + testFiles.map(f => `<li id="${f}">${f}</li>`).join("\n") + "</ul>";
}

setupTests();

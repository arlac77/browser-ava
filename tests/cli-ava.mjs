import test from "ava";
import { execa } from "execa";

test("cli all passed", async t => {
  const p = await execa(
    "node",
    [
      new URL("../src/browser-ava-cli.mjs", import.meta.url).pathname,
      "--port",
      8091,
      "--no-keep-open",
      "--headless",
      "--chromium",
      "tests/fixtures/tests/sec*-test.mjs" // test glob expansion
    ],
    { all: true }
  );
  t.is(p.exitCode, 0);
});

test("cli mixed result", async t => {
  try {
    const p = await execa(
      "node",
      [
        new URL("../src/browser-ava-cli.mjs", import.meta.url).pathname,
        "--port",
        8092,
        "--no-keep-open",
        "--browser",
        "chromium:headless",
        "tests/fixtures/tests/first-test.mjs"
      ],
      { all: true }
    );
  } catch (p) {
    t.is(p.exitCode, 1);
    t.regex(p.all, /6 tests failed/);
    t.regex(p.all, /1 known failure/);
    t.regex(p.all, /2 tests todo/);
  }
});

test("cli invalid test", async t => {
  try {
    const p = await execa(
      "node",
      [
        new URL("../src/browser-ava-cli.mjs", import.meta.url).pathname,
        "--port",
        8093,
        "--no-keep-open",
        "--headless",
        "--chromium",
        "tests/fixtures/tests/invalid-test.mjs"
      ],
      { all: true }
    );
  } catch (p) {
    t.is(p.exitCode, 2);
    t.regex(p.all, /TypeError/);
  }
});

test("cli with dynamic import test", async t => {
  const p = await execa(
    "node",
    [
      new URL("../src/browser-ava-cli.mjs", import.meta.url).pathname,
      "--port",
      8094,
      "--no-keep-open",
      "--headless",
      "--chromium",
      "tests/fixtures/tests/dynamic-import-test.mjs"
    ],
    { all: true }
  );

  t.regex(p.all, /1 test passed/);
  t.is(p.exitCode, 0);
});

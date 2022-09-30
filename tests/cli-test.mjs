import test from "ava";
import { execa } from "execa";

test("cli simple", async t => {
  const p = await execa(
    "node",
    [
      new URL("../src/browser-ava-cli.mjs", import.meta.url).pathname,
      "tests/fixtures/tests/first-test.mjs"
    ],
    { all: true }
  );

  t.log(p.all);
  console.log(p.all);

  t.is(p.exitCode, 0);
});

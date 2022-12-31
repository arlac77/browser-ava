import test from "ava";

test("test with dynamic import", async t => {
  const module = await import("./foo.mjs");
  t.is(module.default.name, "foo", "assert title 1");
});


import test from "ava";

import foo from "unknown";

test("test with syntax error", t => {
  t.is(1, 1, "assert title 1");
  foo();
});


import test from "ava";

import { foo } from "./foo.mjs";
import { bar } from "bar";
import { baz } from "baz";

function wait(ms=1000) {
  return new Promise((resolve,reject)=>setTimeout(resolve,ms));
}

test.before(t => {
  console.log("before");
});
test.after(t => {
  console.log("after");
});
test.after.always(t => {});

test.beforeEach(t => {
  console.log("beforeEach", t.title);
});
test.afterEach("test.afterEach", t => {
  console.log("afterEach", t.title);
});

test("test.1", t => {
  t.log("1st. assertion is coming soon");
  t.is(foo(), "foo");
  t.is(bar(), "bar");
  t.is(baz(), "baz");
  t.not(1,2);
});

test("test.2", async t => {
  await wait(1000);
  t.true(1 === 2, "assert title 2");
});

test("test.throws", t => {
  t.throws(() => {
    throw new Error("must throw");
  });
});

test("test.empty", t => {});
test("test.plan", t => {
  t.plan(2);
  t.true(1 === 1);
});

test("test.pass", t => {
  t.pass();
});

test("test.fail", t => {
  t.fail();
});

test.serial("test.serial.1", t => {
  t.true(1 === 1);
});

test.serial("test.serial.2", t => {
  t.true(1 === 1);
});

test.failing("test.failing", t => {
  t.true(1 === 2, "assert title 2");
});

test.todo("todo");
test.serial.todo("serial.todo");

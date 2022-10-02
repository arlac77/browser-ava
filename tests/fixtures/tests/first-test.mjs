import test from "ava";

test.before(t => {});
test.before.always(t => {});
test.after(t => {});
test.after.always(t => {});

test.beforeEach(t => {
  console.log("beforeEach", t.title);
});
test.afterEach('test.afterEach',t => {
  console.log("afterEach", t.title);
});

test("test.1", t => {
  t.log("1st. assertion is coming soon");
  t.is(1, 1, "assert title 1");
});

test("test.2", t => {
  t.true(1 === 2, "assert title 2");
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

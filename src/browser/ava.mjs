/**
 * Holds all tests
 */
export const world = { files: {}, current: undefined };

/**
 * Collect all tests into world
 */
export default function test(title, body, ...args) {
  const def = { title, body, args, skip: false };
  world.current.tests.push(def);
  return def;
}

test.failing = (...args) => {
  test(...args).failing = true;
};

test.skip = (...args) => {
  test(...args).skip = true;
};

test.only = (...args) => {
  test(...args).only = true;
};

test.serial = (...args) => {
  test(...args).serial = true;
};

test.todo = title => {
  const def = { title, todo: true };
  world.current.tests.push(def);
};

test.serial.todo = test.todo;

test.before = () => {};
test.before.always = () => {};
test.serial.before = () => {};

test.after = () => {};
test.after.always = () => {};
test.serial.after = () => {};

test.beforeEach = () => {};
test.beforeEach.always = () => {};

test.afterEach = () => {};
test.afterEach.always = () => {};

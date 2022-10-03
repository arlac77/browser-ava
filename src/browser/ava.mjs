/**
 * Holds all tests
 */
export const testModules = [];

/**
 * Collect all tests into testModules
 */
export default function test(title, body, ...args) {
  const def = { title, body, args, skip: false };
  testModules.at(-1).tests.push(def);
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
  testModules.at(-1).tests.push(def);
};

test.serial.todo = test.todo;

test.before = (...args) => {
  const def = { args };
  testModules.at(-1).before.push(def);
  return def;
};

test.serial.before = (...args) => {
  test.before(...args).serial = true;
};

test.after = (...args) => {
  const def = { args };
  testModules.at(-1).after.push(def);
  return def;
};
test.after.always = (...args) => {
  test.after(...args).always = true;
};

test.serial.after = (...args) => {
  test.after(...args).serial = true;
};

test.beforeEach = (...args) => {
  const def = { args };
  testModules.at(-1).beforeEach.push(def);
  return def;
};
test.beforeEach.always = (...args) => {
  test.beforeEach(...args).always = true;
};

test.afterEach = (...args) => {
  const def = { args };
  testModules.at(-1).afterEach.push(def);
  return def;
};
test.afterEach.always = () => {
  test.afterEach(...args).always = true;
};

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

test.skip = (...args) => {
  test(...args).skip = true;
};

/**
 * Holds all tests
 */
export const world = { files: {}, current: undefined };

/**
 * Collect all tests into world
 */
export default async function test(name, body, ...args) {
  world.current.tests.push({ name, body, args, assertions: [], skip: false });
}

test.skip = (name, body, ...args) =>
  world.current.tests.push({ name, body, args, assertions: [], skip: true });

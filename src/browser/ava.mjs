/**
 * Holds all tests
 */
export const world = { files: {}, current: undefined };

/**
 * Collect all tests into world
 */
export default async function test(name, body) {
  world.current.tests.push({ name, body, assertions: [], skip: false });
}

test.skip = (name, body) =>
  world.current.tests.push({ name, body, assertions: [], skip: true });

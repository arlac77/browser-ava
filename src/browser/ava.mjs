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

export function textContext(def) {
  const name = def.name;
  const assertions = def.assertions;

  return {
    throws(a, name) {},
    deepEqual(a, b, name) {
      assertions.push({ ok: a === b, message, name });
    },
    is(a, b, name) {
      assertions.push({ ok: a === b, message: `${a} != ${b}`, name });
    },
    true(value, name) {
      assertions.push({
        ok: value === true,
        message: `${value} != true`,
        name
      });
    },
    false(value, name) {
      assertions.push({
        ok: value === true,
        message: `${value} != false`,
        name
      });
    }
  };
}

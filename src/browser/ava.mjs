
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
    throws(a, message = name) {},
    deepEqual(a, b, message = name) {
      assertions.push({});
      if (a !== b)
        console.log(`${message}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    },
    is(a, b, message = name) {
      assertions.push({});
      if (a !== b)
        console.log(`${message}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    },
    true(value, message = name) {
      assertions.push({});
      if (value !== true) console.log(`${message}: ${value}`);
    },
    false(value, message = name) {
      assertions.push({});
      if (value !== false) console.log(`${message}: ${value}`);
    }
  };
}

export default async function test(name, body) {
  let assertions = [];

  const t = {
    is(a, b, message=name) {
      assertions.push({});
      if (a !== b) console.log(`${message}: ${a} != ${b}`);
    },
    true(value, message=name) {
      assertions.push({});
      if (value !== true) console.log(`${message}: ${value}`);
    },
    false(value, message=name) {
      assertions.push({});
      if (value !== false) console.log(`${message}: ${value}`);
    }
  };

  await body(t);

  //console.log(assertions);
}

test.skip = () => {}

function addResult() {}

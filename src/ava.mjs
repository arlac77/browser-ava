
export default async function test(name, body) {
  let assertions = [];

  const t = {
    is(a,b) {
      assertions.push({});
      if (a !== b) console.log(`${name}: ${a} != ${b}`);
    },
    true(value) {
      assertions.push({});
      if (value !== true) console.log(`${name}: ${value}`);
    },
    false(value) {
      assertions.push({});
      if (value !== false) console.log(`${name}: ${value}`);
    }
  };

  await body(t);

  console.log(assertions);
}

function addResult() {
}
export default async function test(name, body) {
  let assertions = [];

  const t = {
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

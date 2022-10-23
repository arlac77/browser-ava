import test from "ava";

import { foo } from "./foo.mjs";
import { bar, internal } from "bar";
import { extra } from "bar/extra";
import { baz, bazbay } from "baz";

function wait(ms = 1000) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

test.before(t => {
  t.context.a = "a";
  t.log("before");
});
test.after(t => {
  t.log("after");
});
test.after.always(t => {});

test.beforeEach(t => {
  t.log("beforeEach", t.title);
});
test.afterEach("test.afterEach", t => {
  t.log("afterEach", t.title);
});

test("test.context", t => {
  t.is(t.context.a, "a");
});

test("test.resolv", t => {
  t.is(foo(), "foo");
  t.is(bar(), "bar");
  t.is(extra(), "extra");
  t.is(baz(), "baz");
  t.is(bazbay(), "bazbay");
  t.is(internal(), "browser internal"); // differs between ava and browser-ava
});

test("test.kitchensink", t => {
  t.log("1st. assertion is coming soon");
  t.is(1, 1);
  t.not(1, 2);
  t.deepEqual(
    [
      1,
      {
        string: "s",
        number: 1,
        null: null,
        undefined: undefined,
        data: new Date(1),
        bigInt: 9007199254740991n,
        map: new Map([["k", "v"]]),
        set: new Set(["k"])
      }
    ],
    [
      1,
      {
        string: "s",
        number: 1,
        null: null,
        undefined: undefined,
        data: new Date(1),
        bigInt: 9007199254740991n,
        map: new Map([["k", "v"]]),
        set: new Set(["k"])
      }
    ]
  );
  t.notDeepEqual([1, { a: 1 }], [1, { a: 2 }]);
  t.regex("foo", /o/);
  t.notRegex("foo", /bar/);
});

test("test.timeout", async t => {
  t.timeout(1000);
  await wait(100);
  t.true(1 === 2, "assert title 2");
});

test("test.teardown", async t => {
  t.teardown(() => {
    t.log("teardown");
  });
  t.true(true);
});

test("test.throws.instanceOf", t => {
  t.throws(() => JSON.parse("{ xxx"), {
    instanceOf: Error
  });

  t.throws(
    () => {
      throw new TypeError("🦄");
    },
    { instanceOf: TypeError, message: "🦄" }
  );
});

test("test.throws", t => {
  t.throws(() => {
    throw new Error("must throw");
  });
});

test("test.throws.message", t => {
  t.throws(() => JSON.parse("{ xxx"), {
    message: "Unexpected token x in JSON at position 2"
  });
});

test("test.throws.message.2", t => {
  t.throws(
    () => {
      throw new Error("must throw");
    },
    { message: /must/ }
  );
  t.throws(
    () => {
      throw new Error("must throw");
    },
    { message: m => m.length > 0 }
  );
});

test("test.throwsAsync", async t => {
  await t.throwsAsync(
    async () => {
      throw new TypeError("🦄");
    },
    { instanceOf: TypeError, message: "🦄" }
  );
});

test("test.empty", t => {});
test("test.plan", t => {
  t.plan(2);
  t.true(1 === 1);
  t.true.skip(1 === 2);
});

test("test.pass", t => {
  t.pass();
});

test("test.fail", t => {
  t.fail();
});

function template(t, a, b) {
  t.is(a, b);
}

template.title = (title, a, b) => `test.template ${a}<>${b}`;

test("test.template", template, 1, 2);
test(template, 2, 3);

test.serial("test.serial.1", t => {
  t.true(1 === 1);
});

test.serial("test.serial.2", t => {
  t.true(1 === 1);
});

test.failing("test.failing", t => {
  t.true(1 === 2, "assert title 2");
});

test.todo("todo");
test.serial.todo("serial.todo");

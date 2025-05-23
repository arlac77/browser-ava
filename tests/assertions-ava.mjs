import test from "ava";
import { isEqual } from "../src/browser/assertions.mjs";

function eq(t, a, b) {
  t.true(isEqual(a, b));
}

eq.title = (providedTitle = "", a, b) =>
  `equal ${providedTitle} ${a} ${b}`.trim();

function neq(t, a, b) {
  t.false(isEqual(a, b));
}

neq.title = (providedTitle = "", a, b) =>
  `not equal ${providedTitle} ${a} ${b}`.trim();

test(eq, null, null);
test(eq, undefined, undefined);
test(eq, 1, 1);
test(eq, "a", "a");
test(eq, 123n, 123n);
test(eq, true, true);
test(eq, false, false);
test(eq, [], []);
test(eq, [1, 2], [1, 2]);
test(eq, [true, false], [true, false]);
test("object", eq, { a: 1, b: false }, { a: 1, b: false });
test(eq, { a: [1] }, { a: [1] });
test(eq, new Set(), new Set());
test("set filled", eq, new Set(["a"]), new Set(["a"]));
test(eq, new Map(), new Map());
test("Map<>Map", eq, new Map([["a", 1]]), new Map([["a", 1]]));
test(
  "Uint8Array<>Uint8Array",
  eq,
  new Uint8Array([1, 2, 3]),
  new Uint8Array([1, 2, 3])
);
test.only(
  "ArrayBuffer<>ArrayBuffer",
  neq,
  new ArrayBuffer(5),
  new ArrayBuffer(7)
);

test(eq, new Date(), new Date());
test(eq, console.log, console.log);

test(neq, 1, 2);
test(neq, 1, "b");
test(neq, 1, undefined);
test(neq, "a", "b");
test(neq, 123n, 124n);
test(neq, 123n, undefined);
test(neq, null, undefined);
test(neq, null, 1);
test(neq, null, "b");
test(neq, undefined, null);
test(neq, undefined, 1);
test(neq, undefined, 2n);
test(neq, undefined, "a");

test("set filled", neq, new Set(["a"]), new Set(["b"]));
test("Set<>Map", neq, new Set(), new Map());
test("Map<>Set", neq, new Map(), new Set());
test("Map<>Map", neq, new Map([["a", 1]]), new Map([["a", 2]]));

test("array", neq, [1], [2]);
test("array", neq, [1], [1, 2]);
test("array", neq, [1], undefined);
test(neq, { a: 1 }, { a: 2 });
test(neq, { a: 1 }, undefined);
test("object", neq, { a: 1 }, { a: 1, b: 0 });
test("object 2", neq, { a: 1, b: 0 }, { a: 1 });

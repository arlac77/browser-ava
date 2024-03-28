import test from "ava";
import { join } from "node:path";
import {
  resolveImport,
  resolveExports,
  resolveImports
} from "../src/resolver.mjs";

async function ret(t, base, name, result) {
  const pd = new URL(base, import.meta.url).pathname;
  t.is(await resolveImport(name, pd), join(pd, result));
}

ret.title = (title = "resolveImport", base, name, result) =>
  `${title} ${base} ${name} => ${result}`;

test(ret, "./fixtures", "bar", "/src/bar.mjs");
test(ret, "./fixtures", "@a/b", "/node_modules/@a/b/ab.mjs");
test(ret, "./fixtures/node_modules/@a/b", "@a/b", "/ab.mjs");
test(ret, "./fixtures", "@a/c", "/node_modules/@a/c/ac.mjs");
test.skip(ret, "./fixtures/node_modules/@a/b", "@a/c", "../c/ac.mjs");

function rest(t, module, pkg, result) {
  t.is(resolveExports(module.split(/\//), pkg), result);
}

rest.title = (title = "resolveExports", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rest, "a", { name: "a", main: "index.mjs" }, "index.mjs");
test(rest, "a", { name: "a" }, "index.js");
test(rest, "a", { name: "a", exports: { ".": "./src/a.mjs" } }, "./src/a.mjs");
test(rest, "b", { name: "b", exports: { browser: "./b.mjs" } }, "./b.mjs");
test(
  rest,
  "c",
  {
    name: "c",
    exports: { node: { module: "./c-node.mjs" }, default: "./c.mjs" }
  },
  "./c.mjs"
);
test(rest, "d", { name: "d", exports: { default: "./d.mjs" } }, "./d.mjs");
test(rest, "e", { name: "e", exports: "./src/e.mjs" }, "./src/e.mjs");
test(rest, "e/s", { name: "e", exports: "./src/e.mjs" }, undefined);
test(rest, "e/s", { name: "e", exports: { "./s": "./s.mjs" } }, "./s.mjs");
test(rest, "e/s/t", { name: "e", exports: { "./s/t": "./t.mjs" } }, "./t.mjs");
test(
  rest,
  "f",
  {
    name: "f",
    exports: {
      ".": {
        types: "./d.ts",
        default: "./src/f.mjs"
      }
    }
  },
  "./src/f.mjs"
);

test.skip(
  rest,
  "@a/b",
  {
    name: "@a/b",
    exports: "./src/f.mjs"
  },
  "./src/f.mjs"
);

function rist(t, module, pkg, result) {
  t.is(resolveImports(module, pkg), result);
}

rist.title = (title = "resolve imports", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rist, "#a", { imports: { "#a": { default: "./a.mjs" } } }, "./a.mjs");

import test from "ava";
import { join } from "node:path";
import {
  resolveImport,
  resolveExports,
  resolveImports
} from "../src/resolver.mjs";

async function ret(t, name, result) {
  const pd = new URL("./fixtures", import.meta.url).pathname;
  t.is(await resolveImport(name, pd), join(pd, result));
}

ret.title = (title = "resolve import", name, result) =>
  `${title} ${name} => ${result}`;

test(ret, "bar", "/src/bar.mjs");
//test.only(ret, "@a/b", "/index.js");

function rest(t, module, pkg, result) {
  t.is(resolveExports(module.split(/\//), pkg), result);
}

rest.title = (title = "resolve exports", name, pkg, result) =>
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

function rist(t, module, pkg, result) {
  t.is(resolveImports(module, pkg), result);
}

rist.title = (title = "resolve imports", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rist, "#a", { imports: { "#a": { default: "./a.mjs" } } }, "./a.mjs");

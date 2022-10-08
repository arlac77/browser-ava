import test from "ava";
import { resolveExports, resolveImports } from "../src/resolver.mjs";

function ret(t, module, pkg, result) {
  t.is(resolveExports(module.split(/\//), pkg), result);
}

ret.title = (title = "resolve exports", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(ret, "a", { name: "a", main: "index.mjs" }, "index.mjs");
test(ret, "a", { name: "a" }, "index.js");
test(ret, "a", { name: "a", exports: { ".": "./src/a.mjs" } }, "./src/a.mjs");
test(ret, "b", { name: "b", exports: { browser: "./b.mjs" } }, "./b.mjs");
test(
  ret,
  "c",
  {
    name: "c",
    exports: { node: { module: "./c-node.mjs" }, default: "./c.mjs" }
  },
  "./c.mjs"
);
test(ret, "d", { name: "d", exports: { default: "./d.mjs" } }, "./d.mjs");
test(ret, "e", { name: "e", exports: "./src/e.mjs" }, "./src/e.mjs");
test(ret, "e/s", { name: "e", exports: "./src/e.mjs" }, undefined);
test(ret, "e/s", { name: "e", exports: { "./s": "./s.mjs" } }, "./s.mjs");
test(ret, "e/s/t", { name: "e", exports: { "./s/t": "./t.mjs" } }, "./t.mjs");

function rit(t, module, pkg, result) {
  t.is(resolveImports(module, pkg), result);
}

rit.title = (title = "resolve imports", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rit, "#a", { imports: { "#a": { default: "./a.mjs" } } }, "./a.mjs");

import test from "ava";
import { entryPoint } from "../src/resolver.mjs";

function rt(t, module, pkg, result) {
  t.is(entryPoint(module.split(/\//), pkg, ""), result);
}

rt.title = (title = "resolve", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rt, "a", { name: "a", main: "index.mjs" }, "index.mjs");
test(rt, "a", { name: "a" }, "index.js" );
test(rt, "a", { name: "a", exports: { ".": "./src/a.mjs" } }, "src/a.mjs");
test(rt, "b", { name: "b", exports: { browser: "./src/b.mjs" } }, "src/b.mjs");
test(rt, "d", { name: "d", exports: { default: "./src/d.mjs" } }, "src/d.mjs");
test(rt, "e", { name: "e", exports: "./src/e.mjs" }, "src/e.mjs");
test(rt, "e/s", { name: "e", exports: "./src/e.mjs" }, undefined);
test(rt, "e/s", { name: "e", exports: { "./s" : "s.mjs"} }, "s.mjs");

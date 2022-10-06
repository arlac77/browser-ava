import test from "ava";
import { entryPoint } from "../src/resolver.mjs";

function rt(t, module, pkg, result) {
  t.is(entryPoint(module.split(/\//), pkg, ""), result);
}

rt.title = (title = "resolve", name, pkg, result) =>
  `${title} ${name} => ${result}`;

test(rt, "a", { name: "a", main: "index.mjs" }, "index.mjs");
test(
  rt,
  "a",
  { name: "a", exports: { ".": "./src/index.mjs" } },
  "src/index.mjs"
);

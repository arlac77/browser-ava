import { bar } from "bar";

export function foo() {
  return "foo";
}

export function foobar() {
  return foo() + bar();
}

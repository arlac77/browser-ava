import { baz } from "baz";

export function bar() {
  return "bar";
}

export function barbaz() {
  return bar() + baz();
}

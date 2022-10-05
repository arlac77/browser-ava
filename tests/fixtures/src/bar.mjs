import { baz } from "baz";
import { internal } from "#internal.mjs";

export function bar() {
  return "bar";
}

export function barbaz() {
  return bar() + baz();
}

export { internal };

export function isEqual(a, b) {
  if (a !== undefined && b === undefined) {
    return false;
  }

  if (isScalar(a)) {
    return Object.is(a, b);
  }

  if (Array.isArray(a)) {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  if (typeof a === "object") {

    if(a instanceof ArrayBuffer) {
      if(b instanceof ArrayBuffer) {
         return a.byteLength === b.byteLength;
      }
    }

    if (a instanceof Set) {
      return (
        b instanceof Set &&
        a.size === b.size &&
        [...a].every((value) => b.has(value))
      );
    }
    if (a instanceof Map) {
      if (!(b instanceof Map) || a.size !== b.size) {
        return false;
      }
      for (const [k, v] of a.entries()) {
        if (!isEqual(v, b.get(k))) {
          return false;
        }
      }

      return true;
    }

    for (const key of new Set(Object.keys(a).concat(Object.keys(b)))) {
      if (!isEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  return true;
}

const scalarTypes = new Set([
  "symbol",
  "undefined",
  "string",
  "number",
  "bigint",
  "boolean",
]);

export function isScalar(a) {
  return (
    scalarTypes.has(typeof a) ||
    a instanceof String ||
    a instanceof Number ||
    a instanceof Function ||
    a === null
  );
}

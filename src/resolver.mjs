import { join, dirname, resolve } from "node:path";
import { readFile } from "node:fs/promises";

/**
 * @type {BufferEncoding} encoding
 */
export const utf8EncodingOptions = "utf8";

/**
 * Order in which imports are searched
 * @see {https://nodejs.org/dist/latest/docs/api/packages.html#imports}
 */
const importsConditionOrder = ["browser", "default"];

/**
 * Order in which exports are searched
 * @see {https://nodejs.org/dist/latest/docs/api/packages.html#exports}
 */
const exportsConditionOrder = [
  "browser",
  "module",
  "module-sync",
  "import",
  ".",
  "default"
];

/**
 * Find module inside a package.
 * @param {string[]} parts
 * @param {Object} pkg decoded package.json content
 * @returns {string|undefined} module file name relative to package
 */
export function resolveExports(parts, pkg) {
  function matchingCondition(value) {
    switch (typeof value) {
      case "string":
        return value;
      case "object":
        if (value["."]) {
          return matchingCondition(value["."]);
        }
        for (const condition of exportsConditionOrder) {
          if (value[condition]) {
            return value[condition];
          }
        }
    }
  }

  if (parts[0] === pkg.name) {
    switch (parts.length) {
      case 1:
        return matchingCondition(pkg.exports) || pkg.main || "index.js";
      default:
        return matchingCondition(pkg.exports["./" + parts.slice(1).join("/")]);
    }
  }

  /*if(parts.join('/') === pkg.name) {
    return matchingCondition(pkg.exports) || pkg.main || "index.js";
  }*/
}

export function resolveImports(name, pkg) {
  if (name.match(/^#/)) {
    const importSlot = pkg.imports[name];
    if (importSlot) {
      for (const condition of importsConditionOrder) {
        if (importSlot[condition]) {
          return importSlot[condition];
        }
      }
    }
  }
}

async function loadPackage(path) {
  try {
    return JSON.parse(
      await readFile(join(path, "package.json"), utf8EncodingOptions)
    );
  } catch (e) {
    if (e.code !== "ENOTDIR" && e.code !== "ENOENT") {
      throw e;
    }
  }
}

async function findPackage(path) {
  while (path.length) {
    const pkg = await loadPackage(path);
    if (pkg) {
      return {
        path,
        pkg
      };
    }
    path = dirname(path);
  }
}

/**
 * Maps import url from node to browser view.
 * @param {string} name module to resolve
 * @param {string} base where to start resolving
 * @returns {Promise<string>} resolved import url
 */
export async function resolveImport(name, base) {
  if (name.match(/^[\/\.]/)) {
    return resolve(dirname(base), name);
  }

  let parts = name.split(/\//);

  if (parts[0][0] === "@") {
    const i = base.indexOf(parts[0]);
    if (i > 0) {
      base = base.substring(0, i);
    }

    parts = [parts[0] + "/" + parts[1], ...parts.slice(2)];
  }

  let { pkg, path } = await findPackage(base);

  const e = resolveExports(parts, pkg) || resolveImports(name, pkg);

  if (e) {
    return join(path, e);
  }

  while (path.length > 1) {
    const p = join(path, "node_modules", parts[0]);
    pkg = await loadPackage(p);
    if (pkg) {
      return join(p, resolveExports(parts, pkg));
    }
    path = dirname(dirname(path));
  }
}

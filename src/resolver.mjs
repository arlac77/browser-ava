import { join, dirname, resolve } from "node:path";
import { readFile } from "node:fs/promises";

const utf8EncodingOptions = { encoding: "utf8" };

/**
 * Order in which imports are searched
 * @see {https://nodejs.org/dist/latest/docs/api/packages.html#imports}
 */
const importsConditionOrder = ["browser", "default"];

/**
 * Order in which exports are searched
 * @see {https://nodejs.org/dist/latest/docs/api/packages.html#exports}
 */
const exportsConditionOrder = ["browser", "import", ".", "default"];

/**
 * find module inside a package
 * @param {string} parts
 * @param {Object} pkg package.json content
 * @returns {string|undefined} module file name
 */
export function entryPoint(parts, pkg) {
  if (parts[0] === pkg.name) {
    if (parts.length === 1) {
      switch (typeof pkg.exports) {
        case "string":
          return pkg.exports;
        case "object":
          for (const condition of exportsConditionOrder) {
            if (pkg.exports[condition]) {
              return pkg.exports[condition];
            }
          }
      }

      return pkg.main || "index.js";
    } else {
      // TODO find generlized form
      if (parts.length === 2) {
        const slot = "./" + parts[1];

        switch (typeof pkg.exports[slot]) {
          case "string":
            return pkg.exports[slot];

          case "object":
            for (const condition of exportsConditionOrder) {
              if (pkg.exports[slot][condition]) {
                return pkg.exports[slot][condition];
              }
            }
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

export async function resolveImport(name, file) {
  if (name.match(/^[\/\.]/)) {
    return resolve(dirname(file), name);
  }
  let { pkg, path } = await findPackage(file);

  const parts = name.split(/\//);

  const e = entryPoint(parts, pkg);

  if (e) {
    return join(path, e);
  }
  if (name.match(/^#/)) {
    const importSlot = pkg.imports[name];
    if (importSlot) {
      for (const condition of importsConditionOrder) {
        if (importSlot[condition]) {
          return join(path, importSlot[condition]);
        }
      }
    }
  }

  while (path.length > 1) {
    const p = join(path, "node_modules", parts[0]);
    pkg = await loadPackage(p);
    if (pkg) {
      return join(p, entryPoint(parts, pkg));
    }
    path = dirname(dirname(path));
  }
}

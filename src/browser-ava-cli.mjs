#!/usr/bin/env node

import { join } from "path";
import { createWriteStream } from "fs";
import { tmpdir } from "os";
import { mkdtemp } from "fs/promises";
import { chromium } from "playwright";
import { DevServer } from "@web/dev-server-core";

let headless = false;

async function createServer() {
  const dir = await mkdtemp(join(tmpdir(), "ava"));

  let port = 8080;

  const server = new DevServer(
    {
      port,
      rootDir: process.cwd(),
      plugins: [
        {
          name: "import-asset",
          resolveImport({ source }) {
            console.log(source);
            if (source.endsWith(".png")) {
              return `${source}?import-asset=true`;
            }
          },

          serve(context) {
            if (context.URL.searchParams.get("import-asset") === "true") {
              return {
                body: `export default ${JSON.stringify(context.path)}`,
                type: "js"
              };
            }
          }
        }
      ],
      middleware: []
    },
    {
      log: console.log,
      debug: console.debug,
      error: console.error,
      warn: console.warn,
      logSyntaxError(error) {
        console.error(error.message);
      }
    }
  );

  const importmap = {
    imports: {
      ava: "./ava.mjs",
      "content-entry": "../../src/index.mjs"
    }
  };

  const f = createWriteStream(join(dir, "index.html"), { encoding: "utf8" });
  f.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>AVA test runner</title>
    <script type="importmap">
    ${JSON.stringify(importmap)}
    </script>
    <script type="module" src="web-test.mjs">
    </script>
</head>
<body>
</body>
</html>`);

  return { server, port };
}

async function run() {
  const { server, port } = await createServer();
  server.start();

  const browser = await chromium.launch({ headless });

  //console.log(browser);
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/index.html`);
  //await browser.close();
}

run();

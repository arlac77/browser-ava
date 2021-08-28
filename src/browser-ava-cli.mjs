#!/usr/bin/env node

import { chromium } from 'playwright';
import { DevServer } from "@web/dev-server-core";
import { createWriteStream } from "fs";

let port = 8080;
let headless = false;

const server = new DevServer(
  {
    port,
    rootDir: process.cwd(),
    plugins: [],
    middleware: [],
  },
  {
    log: console.log,
    debug: console.debug,
    error: console.error,
    warn: console.warn,
    logSyntaxError(error) {
      console.error(error.message);
    },
  },
);

server.start();

const f = createWriteStream("index.html", { encoding: "utf8" });
f.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <title>test</title>
    <script type="importmap">
        {
          "imports": {
            "ava": "./ava.mjs",
            "content-entry": "../../src/index.mjs"
          }
        }
    </script>
    <script type="module" src="web-test.mjs">
    </script>
</head>
<body>
</body>
</html>`);

async function run() {
  const browser = await chromium.launch({ headless });

  console.log(browser);
  const page = await browser.newPage();
  const x = await page.goto(`http://localhost:${port}/index.html`);
  console.log(x);
  //   await browser.close();
}


run();


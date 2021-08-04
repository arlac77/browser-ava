#!/usr/bin/node

import { chromium, firefox, webkit } from 'playwright';
import { DevServer } from "@web/dev-server-core";

let port = 8080;
let headless = true;

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

async function run() {
  const browser = await chromium.launch({ headless });

  console.log(browser);
  const page = await browser.newPage();
  const x = await page.goto(`http://localhost:${port}/tests/index.html`);
  console.log(x);
  //   await browser.close();
}


run();


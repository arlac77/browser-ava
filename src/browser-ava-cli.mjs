#!/usr/bin/env node
import { createReadStream } from "fs";
import { chromium } from "playwright";
import Koa from "koa";
import Router from "koa-better-router";

let headless = false;

async function createServer(testFiles) {
  const importmap = {
    imports: {
      ava: "./ava.mjs",
      "content-entry": "../../src/index.mjs"
    }
  };

  let port = 8080;

  const app = new Koa();
  const router = Router();

  router.addRoute("GET", "index.html", (ctx, next) => {
    ctx.response.type = "text/html";
    ctx.body = `<!DOCTYPE html>
<html lang="en">
<head>
    <title>AVA test runner</title>
    <script type="importmap">
    ${JSON.stringify(importmap)}
    </script>
    <script type="module" src="web-test.mjs"></script>
    ${testFiles
      .map(f => `<script type="module" src="${f}"></script>`)
      .join("\n")}
</head>
<body>
<h3>AVA test runner</h3>
<div id="tests">
</div>
</body>
</html>`;

    return next();
  });

  const esm = (ctx, next) => {
    //console.log(ctx.request.path);
    ctx.response.type = "text/javascript";
    ctx.body = createReadStream(
      new URL("." + ctx.request.path, import.meta.url).pathname
    );
    return next();
  };

  for (const e of ["web-test.mjs", "ava.mjs"]) {
    router.addRoute("GET", e, esm);
  }

  const tf = (ctx, next) => {
    console.log(ctx.request.path);
    ctx.response.type = "text/javascript";
    ctx.body = createReadStream("." + ctx.request.path);
    return next();
  };

  for (const t of testFiles) {
    router.addRoute("GET", t, tf);
  }

  app.use(router.middleware());

  const server = await new Promise((resolve, reject) => {
    const server = app.listen(port, error => {
      if (error) {
        reject(error);
      } else {
        resolve(server);
      }
    });
  });

  return {
    server,
    port
  };
}

async function run() {
  const { server, port } = await createServer([
    "tests/fixtures/tests/simple-test.mjs"
  ]);

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/index.html`);
}

run();

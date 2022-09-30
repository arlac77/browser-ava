#!/usr/bin/env node
import { createReadStream, readFileSync } from "fs";
import { chromium } from "playwright";
import Koa from "koa";
import Router from "koa-better-router";
import { program } from "commander";

const utf8EncodingOptions = { encoding: "utf8" };

const { version, description } = JSON.parse(
  readFileSync(
    new URL("../package.json", import.meta.url).pathname,
    utf8EncodingOptions
  )
);

let headless = false;

program
  .description(description)
  .version(version)
  .argument("<tests...>")
  .action(async (tests, options) => {
    const { server, port } = await createServer(tests);

    const browser = await chromium.launch({ headless });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/index.html`);
  });

program.parse(process.argv);

async function createServer(tests) {
  const pkg = JSON.parse(
    await readFileSync("package.json", utf8EncodingOptions)
  );

  const importmap = {
    imports: {
      ava: "./src/browser/ava.mjs",
    //  runtime: "./src/browser/runtime.mjs"
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
    <script type="module" src="runtime.mjs"></script>
</head>
<body>
<h3>AVA test runner</h3>
<button id="run">run</button>
<div id="tests">
</div>
</body>
</html>`;

    return next();
  });

  app.on("error", err => {
    console.error("server error", err);
  });

  const esm = (ctx, next) => {
    ctx.response.type = "text/javascript";
    ctx.body = createReadStream(
      new URL("." + ctx.request.path, import.meta.url).pathname
    );
  };

  for (const e of ["runtime.mjs", "ava.mjs"]) {
    router.addRoute("GET", e, esm);
  }

  router.addRoute("GET", "tests.json", (ctx, next) => {
    ctx.response.type = "application/json";
    ctx.body = tests;
  });

  const tf = (ctx, next) => {
    ctx.response.type = "text/javascript";
    ctx.body = createReadStream("." + ctx.request.path);
  };

  for (const t of tests) {
    router.addRoute("GET", t, tf);
  }

  app.use(router.middleware());

  app.use(async (ctx, next) => {
    if (!ctx.response.type) {
      if (ctx.request.path.endsWith(".mjs")) {
        ctx.response.type = "text/javascript";

        // use 'es-module-lexer' to rewrite imports

        ctx.body = createReadStream("." + ctx.request.path);
      }
    }
    await next();
  });

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

#!/usr/bin/env node
import { createReadStream, readFileSync } from "node:fs";
import { chromium } from "playwright";
import Koa from "koa";
import Router from "koa-better-router";
import Static from "koa-static";
import { program } from "commander";

const utf8EncodingOptions = { encoding: "utf8" };

const { version, description } = JSON.parse(
  readFileSync(
    new URL("../package.json", import.meta.url).pathname,
    utf8EncodingOptions
  )
);

program
  .description(description)
  .version(version)
  .option("--port <number>", "server port to use", 8080)
  .option("--headless", "hide browser window", false)
  .option(
    "--no-keep-open",
    "keep browser-ava and the page open after execution",
    true
  )
  .argument("<tests...>")
  .action(async (tests, options) => {
    const { server, port } = await createServer(tests, options);

    const browser = await chromium.launch({ headless: options.headless });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/index.html`);

    const run = page.locator("#run");
    await run.click();

    if (!options.keepOpen) {
      await browser.close();
      server.close();
    }
  });

program.parse(process.argv);

async function createServer(tests, options) {
  let port = options.port;

  const app = new Koa();
  const router = Router();

  app.use(Static(new URL("./browser", import.meta.url).pathname));

  app.on("error", err => {
    console.error("server error", err);
  });

  const esm = (ctx, next) => {
    ctx.response.type = "text/javascript";
    ctx.body = createReadStream(
      new URL("." + ctx.request.path, import.meta.url).pathname
    );
  };

  for (const e of ["runtime.mjs"]) {
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

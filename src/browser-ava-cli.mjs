#!/usr/bin/env node
import { createReadStream, readFileSync } from "node:fs";
import { chromium } from "playwright";
import Koa from "koa";
import Router from "koa-better-router";
import Static from "koa-static";
import { WebSocketServer } from "ws";
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
    const { server, port, wss } = await createServer(tests, options);

    wss.on("connection", ws => {
      ws.on("message", async data => {
        data = JSON.parse(data);
        switch (data.action) {
          case "ready":
            console.log(">ready");

            console.log("<run");
            ws.send(JSON.stringify({ action: "run" }));
            break;
          case "result":
            console.log(">result");
        //    console.log(JSON.stringify(data.data, undefined, 2));
            const failed = data.data.find(f => f.tests.find(t => t.passed === false));
            console.log(failed ? "failed" : "passed");

            if (!options.keepOpen) {
              await browser.close();
              server.close();
              process.exit(failed ? 1 : 0);
            }
        }
      });

      console.log("<load");
      ws.send(JSON.stringify({ action: "load", data: tests }));
    });

    const browser = await chromium.launch({ headless: options.headless });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/index.html`);
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

  app.use(router.middleware());

  app.use(async (ctx, next) => {
    const path = ctx.request.path;
    console.log(path);
    if (path.endsWith(".mjs")) {
      ctx.response.type = "text/javascript";

      // use 'es-module-lexer' to rewrite imports

      ctx.body = createReadStream("." + path);
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

  const wss = new WebSocketServer({ server });

  return {
    server,
    wss,
    port
  };
}

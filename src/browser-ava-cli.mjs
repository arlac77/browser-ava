#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { init, parse } from "es-module-lexer";
import { chromium } from "playwright";
import Koa from "koa";
import Static from "koa-static";
import { WebSocketServer } from "ws";
import { program, Option } from "commander";

const utf8EncodingOptions = { encoding: "utf8" };

const { version, description } = JSON.parse(
  readFileSync(
    new URL("../package.json", import.meta.url).pathname,
    utf8EncodingOptions
  )
);

/**
 * route for testcases
 */
const TESTCASES = "/testcases";

program
  .description(description)
  .version(version)
  .addOption(
    new Option("-p, --port <number>", "server port to use")
      .default(8080)
      .env("PORT")
  )
  .option("--headless", "hide browser window", false)
  .option(
    "--no-keep-open",
    "keep browser-ava and the page open after execution",
    true
  )
  .argument("<tests...>")
  .action(async (tests, options) => {
    await init;

    let n = 1;
    tests = tests.map(file => {
      return { url: `${TESTCASES}/${n++}.mjs`, file };
    });

    const { server, wss } = await createServer(tests, options);

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
            const failed = data.data.find(f =>
              f.tests.find(t => t.passed === false)
            );
            console.log(failed ? "failed" : "passed");

            if (!options.keepOpen) {
              await browser.close();
              server.close();
              process.exit(failed ? 1 : 0);
            }
        }
      });

      console.log("<load");
      ws.send(
        JSON.stringify({
          action: "load",
          data: tests
        })
      );
    });

    const browser = await chromium.launch({ headless: options.headless });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${options.port}/index.html`);
  });

program.parse(process.argv);

async function loadAndRewriteImports(file) {
  let body = await readFile(file, utf8EncodingOptions);

  const [imports] = parse(body);

  const importmap = {
    "ava" : "../ava.mjs"
  };

  for(const i of imports) {
    const m = importmap[i.n];
    if(m) {
      body = body.substring(0,i.s) + m + body.substring(i.e);
    }
  }

  return body;
}

async function createServer(tests, options) {
  const app = new Koa();

  app.use(Static(new URL("./browser", import.meta.url).pathname));

  app.on("error", console.error);

  app.use(async (ctx, next) => {
    const path = ctx.request.path;

    if (path.startsWith(TESTCASES)) {
      for (const t of tests) {
        if (t.url === path) {
          ctx.response.type = "text/javascript";
          ctx.body = await loadAndRewriteImports(t.file);
          return;
        }
      }
    }
    await next();
  });

  const server = await new Promise((resolve, reject) => {
    const server = app.listen(options.port, error => {
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
    wss
  };
}

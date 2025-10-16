#!/usr/bin/env -S node --no-warnings --title browser-ava
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { init, parse } from "es-module-lexer";
import { chromium, firefox, webkit } from "playwright";
import Koa from "koa";
import Static from "koa-static";
import Cors from "@koa/cors";
import { WebSocketServer } from "ws";
import { program, Option } from "commander";
import { calculateSummary, summaryMessages } from "./browser/util.mjs";
import { resolveImport, utf8EncodingOptions } from "./resolver.mjs";
import { globby } from "globby";
import chalk from "chalk";
import { encycle } from "json-cyclic";
import pkg from "../package.json" with { type: "json" };

const knownBrowsers = {
  chrome: chromium,
  chromium: chromium,
  firefox: firefox,
  webkit: webkit,
  safari: webkit
};

const browsers = [];
let openBrowsers = [];

Object.entries(knownBrowsers).forEach(([name, browser]) => {
  program.option(`--${name}`, `run tests against ${name} browser`, () =>
    browsers.push(browser)
  );
});

program
  .description(pkg.description)
  .version(pkg.version)
  .addOption(
    new Option("-p, --port <number>", "server port to use")
      .default(8080)
      .env("PORT")
  )
  .addOption(
    new Option(
      "-b, --browser <name>[,secondBrowserName]",
      "browsers to use"
    ).env("BROWSER")
  )
  .option("--headless", "hide browser window", false)
  .option(
    "--keep-open",
    "keep browser-ava and the browser open after execution",
    true
  )
  .option(
    "--no-keep-open",
    "close browser-ava and the browsers after execution",
    true
  )
  .argument("<tests...>")
  .action(async (tests, options) => {
    if (options.browser) {
      for (let b of options.browser.split(/,/)) {
        const parts = b.split(/:/);
        if (parts.length > 1) {
          if (parts[1] === "headless") {
            options.headless = true;
          }
          b = parts[0];
        }

        const browser = knownBrowsers[b];
        if (browser) {
          browsers.push(browser);
        } else {
          console.error(`Unknwon browser ${b}`);
        }
      }
    }

    if (browsers.length === 0) {
      console.error(
        `No browsers selected use ${Object.keys(knownBrowsers).map(
          b => ` --${b}`
        )}`
      );
      process.exit(2);
    }

    await init;

    tests = (await globby(tests)).map(file => {
      return { url: resolve(process.cwd(), file), file };
    });

    const { server, wss } = await createServer(tests, options);

    async function shutdown(failed, force) {
      if (!options.keepOpen || force) {
        await Promise.all(openBrowsers.map(browser => browser.close()));
        server.close();
        process.exit(force ? 2 : failed ? 1 : 0);
      }
    }

    let errors = 0;

    wss.on("connection", ws => {
      ws.on("message", async content => {
        const { action, data } = encycle(JSON.parse(content));
        switch (action) {
          case "info":
            console.info(...data);
            break;
          case "log":
            console.log(...data);
            break;
          case "error":
            errors++;
            console.error(...data);
            await shutdown(true, false);
            break;

          case "ready":
            ws.send(JSON.stringify({ action: "run" }));
            break;

          case "update":
            if (data.skip) {
              console.log(" ", chalk.yellow("- [skip] " + data.title));
            } else {
              if (data.todo) {
              } else {
                if (data.passed === true) {
                  console.log(" ", chalk.green("✔"), data.title);
                } else {
                  console.log(" ", chalk.red("✘ [fail]: "), data.title);
                  if(data.message) {
                    console.log("   ", data.message);
                    if(data.stack) {
                      console.log("   ", data.stack);
                    }
                  }
                }
              }
            }
            break;

          case "result":
            console.log("  ─\n");
            const summary = calculateSummary(data);

            const classToColor = {
              failed: "red",
              passed: "green",
              todo: "blue",
              skip: "yellow"
            };

            for (const m of summaryMessages(summary)) {
              console.log(
                "  " + chalk[classToColor[m.colorClass] || "black"](m.text)
              );
            }

            await shutdown(summary.failed);
        }
      });

      ws.send(
        JSON.stringify({
          action: "load",
          data: tests
        })
      );
    });

    openBrowsers = await Promise.all(
      browsers.map(async b => {
        const browser = await b.launch({ headless: options.headless });
        const page = await browser.newPage();
        await page.goto(`http://localhost:${options.port}/index.html`);
        return browser;
      })
    );
  });

program.parse(process.argv);

async function loadAndRewriteImports(file) {
  let body = await readFile(file, utf8EncodingOptions);

  const [imports] = parse(body);

  let d = 0;

  for (const i of imports) {
    let m;

    if (i.n === "ava") {
      //  m = new URL("browser/ava.mjs", import.meta.url).pathname;
      m = "/ava.mjs";
    }

    if (!m) {
      m = await resolveImport(i.n, resolve(process.cwd(), file));
    }

    if (m) {
      if (i.d > -1) {
        body = body.substring(0, i.s + 1 + d) + m + body.substring(i.e - 1 + d);
      } else {
        body = body.substring(0, i.s + d) + m + body.substring(i.e + d);
      }

      d += m.length - i.n.length;
    } else {
      console.warn(`${file}: Unable to resolve "${i.n}" may lead to import errors`);
    }
  }
  return body;
}

async function createServer(tests, options) {
  const app = new Koa();

  app.use(Cors({ origin: "*" }));

  app.use(Static(new URL("./browser", import.meta.url).pathname));

  app.on("error", console.error);

  app.use(async (ctx, next) => {
    const path = ctx.request.path;

    if (path.endsWith(".mjs") || path.endsWith(".js")) {
      ctx.response.type = "text/javascript";
      ctx.body = await loadAndRewriteImports(path);
      return;
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

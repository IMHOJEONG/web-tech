import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(
  new URL("../../../apps/docs/package.json", import.meta.url),
);
const { chromium } = require("@playwright/test");
const article = readFileSync(
  new URL(
    "../../../apps/docs/data/v8/javascript-event-loop-runtime.mdx",
    import.meta.url,
  ),
  "utf8",
);
const code = article.match(/```js\n([\s\S]*?)```/)[1];
const documented = article
  .match(/```text\n([\s\S]*?)```/)[1]
  .trim()
  .split("\n");
const expected = [
  "sync:start",
  "sync:end",
  "microtask:promise",
  "microtask:queued",
  "microtask:nested",
  "task:timer",
];

test(
  "article example matches documented browser order in 10 fresh pages",
  { timeout: 60000 },
  async () => {
    assert.deepEqual(documented, expected);
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
    });
    const result = {
      date: new Date().toISOString(),
      version: browser.version(),
      mode: "headless",
      source: "article classic script",
      samples: [],
    };
    try {
      for (let i = 0; i < 10; i++) {
        const page = await browser.newPage();
        const logs = [];
        const errors = [];
        page.on("console", (message) => {
          if (message.type() === "log") logs.push(message.text());
        });
        page.on("pageerror", (error) => errors.push(error.message));
        const completed = page.waitForEvent("console", {
          predicate: (message) => message.text() === "task:timer",
          timeout: 5000,
        });
        await page.setContent(
          `<!doctype html><html><body><script>${code}</script></body></html>`,
        );
        await completed;
        result.samples.push({ run: i + 1, logs, errors });
        assert.deepEqual(logs, expected);
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
      writeFileSync(
        "/tmp/event-loop-browser-result.json",
        JSON.stringify(result, null, 2) + "\n",
      );
      console.log(JSON.stringify(result));
    }
  },
);

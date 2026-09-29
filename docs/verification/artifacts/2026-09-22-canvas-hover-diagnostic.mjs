import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const root = process.cwd();
const require = createRequire(`${root}/apps/docs/package.json`);
const { chromium } = require("@playwright/test");
const article = readFileSync(`${root}/apps/docs/data/canvas/readme.md`, "utf8");
const html = article.match(/```html\n([\s\S]*?)```/)[1];
const code = article.split("### 해결 방법")[1].match(/```js\n([\s\S]*?)```/)[1];
const pages = {
  "/article": `<!doctype html><html><body>${html}<script>${code}</script></body></html>`,
  "/demo": readFileSync(
    `${root}/apps/docs/public/experiments/html-in-canvas/index.html`,
    "utf8",
  ),
  "/control":
    '<!doctype html><html><body><button style="position:absolute;left:288px;top:148px">click me</button></body></html>',
};
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(pages[req.url] ?? "not found");
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const result = {
  date: new Date().toISOString(),
  flag: "CanvasDrawElement",
  cases: [],
};
try {
  for (const headless of process.argv.includes("--headless-only")
    ? [true]
    : [true, false]) {
    const browser = await chromium.launch({
      channel: "chrome",
      headless,
      args: ["--enable-blink-features=CanvasDrawElement"],
    });
    result.version = browser.version();
    try {
      for (const route of Object.keys(pages)) {
        for (let run = 1; run <= 3; run++) {
          const page = await browser.newPage({
            viewport: { width: 1000, height: 700 },
            deviceScaleFactor: 1,
          });
          const entry = {
            mode: headless ? "headless" : "headed",
            route,
            run,
            errors: [],
          };
          page.on("pageerror", (error) => entry.errors.push(error.message));
          await page.addInitScript(() => {
            window.observed = { clicks: 0, events: [] };
            for (const type of [
              "pointermove",
              "pointerover",
              "pointerout",
              "click",
              "focus",
              "blur",
            ]) {
              document.addEventListener(
                type,
                (event) => {
                  if (type === "click" && event.target.tagName === "BUTTON")
                    window.observed.clicks++;
                  window.observed.events.push({
                    type,
                    target: event.target.tagName,
                    x: event.clientX,
                    y: event.clientY,
                    focused: document.hasFocus(),
                  });
                },
                true,
              );
            }
          });
          try {
            await page.goto(
              `http://127.0.0.1:${server.address().port}${route}`,
            );
            await page.bringToFront();
            if (route !== "/control")
              await page.waitForFunction(
                () =>
                  document
                    .querySelector("button")
                    .style.transform.startsWith("matrix"),
                null,
                { timeout: 5000 },
              );
            const box = await page.locator("button").boundingBox();
            const x = box.x + box.width / 2,
              y = box.y + box.height / 2;
            await page.mouse.move(5, 5);
            await page.mouse.move(x, y);
            entry.frames = await page.evaluate(
              async ({ x, y }) => {
                const frames = [];
                for (let i = 0; i < 20; i++) {
                  await new Promise(requestAnimationFrame);
                  const button = document.querySelector("button");
                  frames.push({
                    hover: button.matches(":hover"),
                    focus: document.hasFocus(),
                    visibility: document.visibilityState,
                    hit: document.elementFromPoint(x, y)?.tagName,
                    transform: button.style.transform,
                  });
                }
                return frames;
              },
              { x, y },
            );
            await page.mouse.click(x, y);
            entry.clicks = await page.evaluate(() => window.observed.clicks);
            await page.mouse.click(5, 5);
            entry.outsideClicks = await page.evaluate(
              () => window.observed.clicks,
            );
            entry.events = await page.evaluate(() => window.observed.events);
            entry.hoverFrames = entry.frames.filter(
              (frame) => frame.hover,
            ).length;
          } catch (error) {
            entry.failure = error.message;
          } finally {
            result.cases.push(entry);
            console.log(
              JSON.stringify({
                mode: entry.mode,
                route,
                run,
                hoverFrames: entry.hoverFrames,
                clicks: entry.clicks,
                errors: entry.errors,
                failure: entry.failure,
              }),
            );
            await page.close();
          }
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
  writeFileSync(
    "/tmp/canvas-hover-diagnostic.json",
    JSON.stringify(result, null, 2) + "\n",
  );
}
if (
  result.cases.some(
    (entry) =>
      entry.failure ||
      entry.errors.length ||
      entry.hoverFrames !== 20 ||
      entry.clicks !== 1 ||
      entry.outsideClicks !== 1,
  )
)
  process.exitCode = 1;

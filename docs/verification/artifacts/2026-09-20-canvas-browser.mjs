import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

const root = process.cwd();
const require = createRequire(`${root}/apps/docs/package.json`);
const { chromium } = require("@playwright/test");
const article = readFileSync(`${root}/apps/docs/data/canvas/readme.md`, "utf8");
const html = article.match(/```html\n([\s\S]*?)```/)[1];
const solution = article
  .split("### 해결 방법")[1]
  .match(/```js\n([\s\S]*?)```/)[1];
const demo = readFileSync(
  `${root}/apps/docs/public/experiments/html-in-canvas/index.html`,
  "utf8",
);
const out = "/tmp/canvas-browser-verification";
mkdirSync(out, { recursive: true });
const server = createServer((req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(
    req.url === "/demo"
      ? demo
      : `<!doctype html><html><body>${html}<script>${solution}</script></body></html>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
const result = {
  date: new Date().toISOString(),
  mode: "headed",
  flag: "CanvasDrawElement",
  cases: [],
};
try {
  browser = await chromium.launch({
    channel: "chrome",
    headless: false,
    args: ["--enable-blink-features=CanvasDrawElement"],
  });
  result.version = browser.version();
  for (const route of ["/", "/demo"]) {
    const page = await browser.newPage({
      viewport: { width: 1000, height: 700 },
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.observed = { paints: 0, clicks: 0 };
      document.addEventListener("paint", () => window.observed.paints++, true);
      document.addEventListener(
        "click",
        (event) => {
          if (event.target.tagName === "BUTTON") window.observed.clicks++;
        },
        true,
      );
    });
    await page.goto(`http://127.0.0.1:${server.address().port}${route}`);
    await page.bringToFront();
    const entry = { route, errors };
    try {
      await page.waitForFunction(
        () =>
          document.querySelector("button").style.transform.startsWith("matrix"),
        null,
        { timeout: 8000 },
      );
      entry.state = await page.evaluate(() => {
        const canvas = document.querySelector("canvas");
        const button = document.querySelector("button");
        const rect = button.getBoundingClientRect();
        const cr = canvas.getBoundingClientRect();
        const ctx = canvas.getContext("2d");
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let nonTransparent = 0;
        for (let i = 3; i < pixels.length; i += 4)
          if (pixels[i] > 0) nonTransparent++;
        return {
          ...window.observed,
          transform: button.style.transform,
          rect: rect.toJSON(),
          canvasRect: cr.toJSON(),
          nonTransparent,
          support: {
            draw: typeof ctx.drawElementImage,
            paint: typeof canvas.requestPaint,
          },
          contained:
            rect.left >= cr.left &&
            rect.top >= cr.top &&
            rect.right <= cr.right &&
            rect.bottom <= cr.bottom,
        };
      });
      const { rect, canvasRect } = entry.state;
      const x = rect.x + rect.width / 2,
        y = rect.y + rect.height / 2;
      await page.mouse.move(x, y);
      await page.waitForFunction(
        () => document.querySelector("button").matches(":hover"),
        null,
        { timeout: 3000 },
      );
      entry.hover = await page
        .locator("button")
        .evaluate((el) => el.matches(":hover"));
      entry.hoverFrames = await page.evaluate(async () => {
        const samples = [];
        for (let i = 0; i < 10; i++) {
          await new Promise(requestAnimationFrame);
          samples.push(document.querySelector("button").matches(":hover"));
        }
        return samples;
      });
      await page.mouse.click(x, y);
      entry.afterClick = await page.evaluate(() => window.observed.clicks);
      await page.mouse.click(canvasRect.x + 5, canvasRect.y + 5);
      entry.afterOutsideClick = await page.evaluate(
        () => window.observed.clicks,
      );
      await page.screenshot({
        path: `${out}/${route === "/" ? "article" : "demo"}.png`,
      });
    } catch (error) {
      entry.failure = error.message;
      entry.support = await page.evaluate(() => ({
        draw: typeof document.querySelector("canvas").getContext("2d")
          .drawElementImage,
        paint: typeof document.querySelector("canvas").requestPaint,
      }));
      await page.screenshot({
        path: `${out}/${route === "/" ? "article" : "demo"}-failure.png`,
      });
    }
    result.cases.push(entry);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  writeFileSync(`${out}/result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

if (
  result.cases.length !== 2 ||
  result.cases.some(
    (entry) =>
      entry.failure ||
      entry.errors.length ||
      !entry.state?.contained ||
      !entry.state?.nonTransparent ||
      !entry.hoverFrames?.every(Boolean) ||
      entry.afterClick !== 1 ||
      entry.afterOutsideClick !== 1,
  )
)
  process.exitCode = 1;

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, resolve, sep } from "node:path";

const require = createRequire(
  new URL("../apps/docs/package.json", import.meta.url),
);
const { chromium, firefox, webkit } = require("@playwright/test");
const [baseline, jitless] = process.argv.slice(2);
assert.ok(
  baseline && jitless && process.argv.length === 4,
  "Supply baseline and jitless dist directories",
);

const origin = "http://127.0.0.1:4173";
const policy =
  "script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'";
const fixture = {
  generatedAt: "2026-11-24T00:00:00.000Z",
  dataSource: {
    kind: "mock",
    reason: "derived_from_feed",
    message: "Synthetic CSP verification",
  },
  pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
  items: [
    {
      cveId: "CVE-2099-0001",
      title: "Synthetic CSP Feed fixture",
      priority: "P1",
      severity: "high",
      epssScore: 0.32,
      isKev: false,
      publishedAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-24T00:00:00.000Z",
      matchedWatchlist: [],
    },
  ],
};
const cases = [
  ...[false, true].flatMap((enforce) =>
    ["/", "/feed"].map((path) => ({
      build: "baseline",
      directory: baseline,
      enforce,
      path,
      api: "503",
    })),
  ),
  {
    build: "jitless",
    directory: jitless,
    enforce: false,
    path: "/",
    api: "503",
  },
  {
    build: "jitless",
    directory: jitless,
    enforce: false,
    path: "/feed",
    api: "valid",
  },
  {
    build: "jitless",
    directory: jitless,
    enforce: false,
    path: "/feed",
    api: "invalid",
  },
];
const observations = [];
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await type.launch();
  try {
    for (const { build, directory, enforce, path, api } of cases) {
      const dist = resolve(directory);
      const html = await readFile(resolve(dist, "index.html"), "utf8");
      assert.ok(html.includes("</head>"));
      const page = await browser.newPage({ locale: "ko-KR" });
      try {
        await page.addInitScript(() => {
          window.__cspEvents = [];
          document.addEventListener("securitypolicyviolation", (event) => {
            window.__cspEvents.push({
              directive: event.effectiveDirective,
              disposition: event.disposition,
              resource: ["inline", "eval"].includes(event.blockedURI)
                ? event.blockedURI
                : "resource",
              source: event.sourceFile?.startsWith(`${location.origin}/assets/`)
                ? "app-bundle"
                : "document-or-other",
            });
          });
        });
        await page.route("**/*", async (route) => {
          const url = new URL(route.request().url());
          if (url.origin !== origin) return route.abort();
          if (url.pathname === path) {
            return route.fulfill({
              contentType: "text/html",
              headers: {
                [enforce
                  ? "Content-Security-Policy"
                  : "Content-Security-Policy-Report-Only"]: policy,
              },
              body: html.replace(
                "</head>",
                "<script>window.__cspInlineProbe = true</script></head>",
              ),
            });
          }
          if (url.pathname.startsWith("/api/")) {
            return route.fulfill({
              status: api === "503" ? 503 : 200,
              json: api === "valid" ? fixture : { items: "invalid fixture" },
            });
          }
          const file = resolve(dist, `.${url.pathname}`);
          if (!file.startsWith(dist + sep)) return route.abort();
          const body = await readFile(file).catch((error) => {
            if (error.code !== "ENOENT") throw error;
          });
          if (!body) return route.fulfill({ status: 404 });
          return route.fulfill({
            contentType:
              {
                ".js": "text/javascript",
                ".css": "text/css",
                ".woff2": "font/woff2",
                ".svg": "image/svg+xml",
              }[extname(file)] ?? "application/octet-stream",
            body,
          });
        });
        await page.goto(origin + path);
        if (api === "valid") {
          await page
            .getByRole("heading", { name: fixture.items[0].title })
            .waitFor();
        } else {
          await page
            .getByRole("button", { name: /^(다시 시도|Retry)$/ })
            .first()
            .waitFor();
        }
        await page.waitForFunction(() =>
          window.__cspEvents.some((event) => event.resource === "inline"),
        );
        const { probeRan, events } = await page.evaluate(() => ({
          probeRan: window.__cspInlineProbe === true,
          events: window.__cspEvents,
        }));
        const appEvalCount = events.filter(
          (event) => event.resource === "eval" && event.source === "app-bundle",
        ).length;
        assert.equal(probeRan, !enforce);
        if (build === "jitless") assert.equal(appEvalCount, 0);
        observations.push({
          engine,
          build,
          enforce,
          page: path === "/" ? "overview" : "feed",
          api,
          probeRan,
          appEvalCount,
          events,
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}
assert.ok(
  observations.some(
    (row) => row.build === "baseline" && !row.enforce && row.appEvalCount > 0,
  ),
  "Baseline must observe app-bundle eval in Report-Only",
);
console.log(JSON.stringify({ observations }, null, 2));

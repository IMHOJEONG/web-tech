import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Bundle the actual client and exercise native browser fetch against a local fixture.
const root = fileURLToPath(new URL("../", import.meta.url));
const appRoot = join(root, "apps/vuln-radar");
const appRequire = createRequire(join(appRoot, "package.json"));
const browserRequire = createRequire(join(root, "apps/docs/package.json"));
const { build } = await import(pathToFileURL(appRequire.resolve("vite")).href);
const { chromium } = browserRequire("@playwright/test");
const source = join(appRoot, "src/shared/api/client.ts");
const temp = await mkdtemp(join(tmpdir(), "vuln-radar-api-client-"));
const results = [];
const requests = [];
let browser;
let server;
let browserVersion;
try {
  const entry = join(temp, "entry.mjs");
  await writeFile(
    entry,
    [
      `export { getJson, ApiError } from ${JSON.stringify(source)};`,
      `export { z } from ${JSON.stringify(appRequire.resolve("zod"))};`,
    ].join("\n"),
  );
  await build({
    configFile: false,
    root: appRoot,
    logLevel: "silent",
    resolve: { alias: { "@": join(appRoot, "src") } },
    define: {
      "import.meta.env": JSON.stringify({
        VITE_APP_TITLE: "Synthetic API regression",
        VITE_API_BASE_PATH: "/api/backend/",
        VITE_DEFAULT_ROUTE: "/overview",
      }),
    },
    build: {
      outDir: temp,
      emptyOutDir: false,
      minify: false,
      lib: { entry, formats: ["es"], fileName: () => "client.mjs" },
    },
  });
  const module = await readFile(join(temp, "client.mjs"));
  server = createServer((request, response) => {
    requests.push({
      path: request.url,
      method: request.method,
      accept: request.headers.accept,
    });
    if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      response.end(
        '<script type="module">import * as apiClient from "/client.mjs"; globalThis.apiClient = apiClient;</script>',
      );
    } else if (request.url === "/client.mjs") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(module);
    } else if (request.url === "/api/backend/network") {
      request.socket.destroy();
    } else if (request.url === "/api/backend/timeout-headers") {
      // Native fetch must abort while waiting for response headers.
    } else {
      response.setHeader("Content-Type", "application/json");
      if (request.url === "/api/backend/timeout-body") {
        response.write('{"value":');
      } else if (request.url === "/api/backend/http") {
        response.writeHead(503);
        response.end('{"error":"synthetic unavailable"}');
      } else if (request.url === "/api/backend/schema") {
        response.end('{"value":42}');
      } else if (request.url === "/api/backend/malformed") {
        response.end("{");
      } else {
        response.end('{"value":"ready"}');
      }
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  browser = await chromium.launch();
  browserVersion = browser.version();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => globalThis.apiClient);
  await page.evaluate(() => {
    const nativeFetch = globalThis.fetch;
    globalThis.fetch = (input, init) => {
      globalThis.lastRequestSignal = init?.signal;
      return nativeFetch(input, init);
    };
  });
  for (const [path, code] of [
    ["/success", null],
    ["http", "http"],
    ["schema", "parse"],
    ["malformed", "network"],
    ["network", "network"],
    ["timeout-headers", "network"],
    ["timeout-body", "network"],
  ]) {
    const start = performance.now();
    try {
      const observed = await page.evaluate(async (path) => {
        const { getJson, ApiError, z } = globalThis.apiClient;
        let guard;
        try {
          const data = await Promise.race([
            getJson(path, z.object({ value: z.string() })),
            new Promise((_, reject) => {
              guard = setTimeout(
                () => reject(new Error("regression guard expired")),
                12_000,
              );
            }),
          ]);
          return { data, code: null };
        } catch (error) {
          return {
            isApiError: error instanceof ApiError,
            code: error.code,
            status: error.status,
            hasDetails: Array.isArray(error.details),
            signalReason: globalThis.lastRequestSignal?.reason?.name,
          };
        } finally {
          clearTimeout(guard);
        }
      }, path);
      assert.equal(observed.code, code);
      if (code === null) {
        assert.deepEqual(observed.data, { value: "ready" });
        assert.ok(
          requests.some(
            (r) =>
              r.path === "/api/backend/success" &&
              r.method === "GET" &&
              r.accept === "application/json",
          ),
        );
      } else {
        assert.equal(observed.isApiError, true);
        assert.equal(observed.status, code === "http" ? 503 : null);
        if (code === "parse") assert.equal(observed.hasDetails, true);
        if (path.startsWith("timeout-"))
          assert.equal(observed.signalReason, "TimeoutError");
      }
      results.push({
        path,
        status: "passed",
        durationMs: Math.round(performance.now() - start),
        observed,
      });
    } catch (error) {
      results.push({ path, status: "failed", message: error.message });
      process.exitCode = 1;
    }
  }
} finally {
  await browser?.close();
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  await rm(temp, { recursive: true, force: true });
}
console.log(
  JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      node: process.version,
      browser: browserVersion,
      scope:
        "actual bundled getJson + Zod + native Chromium fetch against local HTTP fixtures; no deployment or upstream requests",
      clientSha256: createHash("sha256")
        .update(await readFile(source))
        .digest("hex"),
      results,
    },
    null,
    2,
  ),
);

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const appRoot = join(root, "apps/vuln-radar");
const appRequire = createRequire(join(appRoot, "package.json"));
const { build } = await import(pathToFileURL(appRequire.resolve("vite")).href);
const browserRequire = createRequire(join(root, "apps/docs/package.json"));
const browsers = browserRequire("@playwright/test");
const source = join(appRoot, "src/shared/api/client.ts");
const temp = await mkdtemp(join(tmpdir(), "vuln-radar-cancellation-"));
const requests = [];
const results = [];
let server;

async function check(browser, engine, origin, name) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(origin);
    await page.waitForFunction(() => globalThis.api);
    const start = performance.now();
    const observed = await page.evaluate(
      async ({ engine, name }) => {
        const { getJson, ApiError, z } = globalThis.api;
        const controller = new AbortController();
        const customReason = new Error("Synthetic caller cancellation");
        const nativeFetch = globalThis.fetch;
        let requestSignal;
        let receivedHeaders = false;
        globalThis.fetch = async (url, init) => {
          requestSignal = init.signal;
          const response = await nativeFetch(url, init);
          receivedHeaders = true;
          if (name === "caller-body") controller.abort();
          return response;
        };
        let timer;
        if (name === "pre-aborted") controller.abort(customReason);
        if (["caller-headers", "caller-custom"].includes(name)) {
          timer = setTimeout(
            () =>
              controller.abort(
                name === "caller-custom" ? customReason : undefined,
              ),
            100,
          );
        }
        const useCaller = ![
          "success-legacy",
          "timeout-headers",
          "http",
          "schema",
          "malformed",
          "network",
        ].includes(name);
        const state = () => ({
          receivedHeaders,
          callerAborted: controller.signal.aborted,
          reason: requestSignal?.reason?.name,
        });
        try {
          const data = await getJson(
            `${engine}/${name}`,
            z.object({ value: z.string() }),
            useCaller ? controller.signal : undefined,
          );
          return { ok: true, data, ...state() };
        } catch (error) {
          return {
            ok: false,
            isApiError: error instanceof ApiError,
            name: error.name,
            code: error.code,
            status: error.status,
            cause: error.cause?.name,
            sameCallerReason: error === controller.signal.reason,
            ...state(),
          };
        } finally {
          clearTimeout(timer);
        }
      },
      { engine, name },
    );

    if (name.startsWith("success-")) {
      assert.equal(observed.ok, true);
      assert.deepEqual(observed.data, { value: "ready" });
    } else if (name.startsWith("caller-") || name === "pre-aborted") {
      assert.equal(observed.isApiError, false);
      assert.equal(observed.sameCallerReason, true);
      assert.equal(observed.callerAborted, true);
      assert.equal(
        observed.name,
        ["caller-custom", "pre-aborted"].includes(name)
          ? "Error"
          : "AbortError",
      );
      if (name === "caller-body") assert.equal(observed.receivedHeaders, true);
    } else {
      assert.equal(observed.isApiError, true);
      assert.equal(
        observed.code,
        name === "http" ? "http" : name === "schema" ? "parse" : "network",
      );
      assert.equal(observed.status, name === "http" ? 503 : null);
      if (name.startsWith("timeout-")) {
        assert.equal(observed.reason, "TimeoutError");
        assert.equal(observed.callerAborted, false);
        assert.ok(performance.now() - start >= 7_500);
        assert.ok(observed.cause);
        if (name === "timeout-body")
          assert.equal(observed.receivedHeaders, true);
      }
    }
    if (name === "pre-aborted") {
      assert.equal(
        requests.some((r) => r.path === `/api/backend/${engine}/${name}`),
        false,
      );
    }
    const row = {
      engine,
      version: browser.version(),
      name,
      durationMs: Math.round(performance.now() - start),
      observed,
    };
    results.push(row);
    console.log("PASS", engine, name);
  } finally {
    await context.close();
  }
}

try {
  const entry = join(temp, "entry.mjs");
  await writeFile(
    entry,
    `export { getJson, ApiError } from ${JSON.stringify(source)};\nexport { z } from ${JSON.stringify(appRequire.resolve("zod"))};\n`,
  );
  await build({
    configFile: false,
    root: appRoot,
    logLevel: "silent",
    resolve: { alias: { "@": join(appRoot, "src") } },
    define: {
      "import.meta.env": JSON.stringify({
        VITE_APP_TITLE: "Synthetic cancellation",
        VITE_API_BASE_PATH: "/api/backend",
        VITE_DEFAULT_ROUTE: "/overview",
      }),
    },
    build: {
      outDir: temp,
      emptyOutDir: false,
      lib: { entry, formats: ["es"], fileName: () => "client.mjs" },
    },
  });
  const module = await readFile(join(temp, "client.mjs"));
  server = createServer((request, response) => {
    if (request.url === "/") {
      response.setHeader("Content-Type", "text/html");
      return response.end(
        '<script type="module">import * as api from "/client.mjs";globalThis.api=api;</script>',
      );
    }
    if (request.url === "/client.mjs") {
      response.setHeader("Content-Type", "text/javascript");
      return response.end(module);
    }
    const row = { path: request.url, closedEarly: false };
    requests.push(row);
    response.on("close", () => {
      row.closedEarly = !response.writableEnded;
    });
    const name = request.url.split("/").at(-1);
    if (name === "network") return request.socket.destroy();
    if (["caller-headers", "caller-custom", "timeout-headers"].includes(name))
      return;
    response.setHeader("Content-Type", "application/json");
    if (["caller-body", "timeout-body"].includes(name))
      return response.write('{"value":');
    if (name === "http") response.writeHead(503);
    response.end(
      name === "malformed"
        ? "{"
        : name === "schema"
          ? '{"value":42}'
          : '{"value":"ready"}',
    );
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}/`;
  for (const engine of ["chromium", "firefox", "webkit"]) {
    const browser = await browsers[engine].launch();
    try {
      for (const name of [
        "success-legacy",
        "success-signal",
        "pre-aborted",
        "caller-headers",
        "caller-body",
        "caller-custom",
        "http",
        "schema",
        "malformed",
        "network",
      ]) {
        await check(browser, engine, origin, name);
      }
      await Promise.all(
        ["timeout-headers", "timeout-body"].map((name) =>
          check(browser, engine, origin, name),
        ),
      );
      for (const name of [
        "caller-headers",
        "caller-body",
        "caller-custom",
        "timeout-headers",
        "timeout-body",
      ]) {
        assert.equal(
          requests.find((r) => r.path === `/api/backend/${engine}/${name}`)
            ?.closedEarly,
          true,
        );
      }
    } finally {
      await browser.close();
    }
  }
  const output = {
    sourceSha256: createHash("sha256")
      .update(await readFile(source))
      .digest("hex"),
    node: process.version,
    results,
    passed: results.length,
  };
  if (process.argv[2])
    await writeFile(process.argv[2], JSON.stringify(output, null, 2) + "\n");
  console.log(
    JSON.stringify({
      passed: results.length,
      scope:
        "actual getJson + Zod + native browser fetch; local synthetic HTTP only",
    }),
  );
} finally {
  if (server?.listening) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  await rm(temp, { recursive: true, force: true });
}

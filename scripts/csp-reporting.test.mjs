import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import {
  CSP_REPORT_LIMITS,
  createCspReportCollector,
} from "../packages/api/csp-reporting.mts";

const origin = "https://collector.example";
const privateMarker = "SYNTHETIC_PRIVATE_VALUE";
function body(overrides = {}) {
  return {
    effectiveDirective: "script-src-elem",
    disposition: "report",
    blockedURL: `https://external.example/${privateMarker}?q=${privateMarker}`,
    documentURL: `${origin}/ko/docs/web/${privateMarker}?q=${privateMarker}#${privateMarker}`,
    sourceFile: privateMarker,
    referrer: privateMarker,
    sample: privateMarker,
    originalPolicy: privateMarker,
    statusCode: 200,
    ...overrides,
  };
}
function modern(overrides) {
  return [
    {
      type: "csp-violation",
      body: body(overrides),
      url: privateMarker,
      user_agent: privateMarker,
    },
  ];
}
function legacy(overrides = {}) {
  return {
    "csp-report": {
      "effective-directive": "script-src-elem",
      disposition: "report",
      "blocked-uri": `https://external.example/${privateMarker}`,
      "document-uri": `${origin}/ko/docs/web/${privateMarker}?q=${privateMarker}`,
      "status-code": 200,
      "script-sample": privateMarker,
      ...overrides,
    },
  };
}
function request(value = modern(), headers = {}, method = "POST") {
  return new Request(`${origin}/api/csp-report?ignored=${privateMarker}`, {
    method,
    headers: { "content-type": "application/reports+json", ...headers },
    ...(method !== "GET" && method !== "HEAD"
      ? { body: typeof value === "string" ? value : JSON.stringify(value) }
      : {}),
  });
}
function fixture(extra = {}) {
  const summaries = [];
  return {
    summaries,
    collect: createCspReportCollector({
      app: "docs",
      emit: (s) => summaries.push(s),
      ...extra,
    }),
  };
}
function streamed(stream, extra = {}) {
  return new Request(`${origin}/api/csp-report`, {
    method: "POST",
    headers: { "content-type": "application/reports+json" },
    body: stream,
    duplex: "half",
    ...extra,
  });
}

test("modern and legacy produce the same safe groups and never retain private fields", async () => {
  const f = fixture();
  for (const r of [
    request(),
    request(legacy(), {
      "content-type": "application/csp-report; charset=UTF-8",
    }),
  ]) {
    const response = await f.collect(r);
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  }
  assert.deepEqual(f.summaries[0], f.summaries[1]);
  assert.deepEqual(f.summaries[0], {
    event: "csp-report-summary",
    schemaVersion: 1,
    app: "docs",
    groups: [
      {
        directive: "script-src-elem",
        disposition: "report",
        resource: "network",
        document: "article",
        status: "2xx",
        count: 1,
      },
    ],
  });
  assert.equal(JSON.stringify(f.summaries).includes(privateMarker), false);
});

test("WebKit report-to single envelopes retain the same redaction under legacy MIME", async () => {
  const f = fixture();
  await f.collect(request());
  const response = await f.collect(
    request(modern()[0], { "content-type": "application/csp-report" }),
  );
  assert.equal(response.status, 204);
  assert.deepEqual(f.summaries[1], f.summaries[0]);
  assert.equal(JSON.stringify(f.summaries).includes(privateMarker), false);
});

test("single-envelope compatibility rejects other types, media and invalid bodies", async () => {
  const f = fixture();
  for (const value of [
    { type: "deprecation", body: body() },
    { type: "csp-violation", body: null },
    { type: "csp-violation", body: [] },
    { body: body() },
  ]) {
    assert.equal(
      (
        await f.collect(
          request(value, { "content-type": "application/csp-report" }),
        )
      ).status,
      400,
    );
  }
  assert.equal((await f.collect(request(modern()[0]))).status, 400);
  assert.equal(
    (
      await f.collect(
        request(modern()[0], { "content-type": "application/json" }),
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await f.collect(
        request(modern()[0], {
          "content-type": "application/csp-report",
          "content-length": "16385",
        }),
      )
    ).status,
    413,
  );
  assert.deepEqual(f.summaries, []);
});

test("a batch aggregates equivalent reports and drops unrelated or malformed entries", async () => {
  const f = fixture();
  const payload = [
    ...modern(),
    ...modern(),
    { type: "deprecation", body: body() },
    ...modern({ effectiveDirective: privateMarker }),
    { type: "csp-violation", body: null },
  ];
  assert.equal((await f.collect(request(payload))).status, 204);
  assert.equal(f.summaries.length, 1);
  assert.equal(f.summaries[0].groups[0].count, 2);
  assert.equal(JSON.stringify(f.summaries).includes(privateMarker), false);
});

for (const [input, expected] of [
  ["inline", "inline"],
  ["eval", "eval"],
  ["wasm-eval", "wasm-eval"],
  ["trusted-types-sink", "trusted-types"],
  ["data:private", "data"],
  ["blob:private", "blob"],
  ["chrome-extension://private", "extension"],
  ["moz-extension://private", "extension"],
  ["safari-web-extension://private", "extension"],
  [null, "other"],
  [privateMarker, "other"],
]) {
  test(`resource classification only emits fixed categories: ${expected}`, async () => {
    const f = fixture();
    await f.collect(request(modern({ blockedURL: input })));
    assert.equal(f.summaries[0].groups[0].resource, expected);
    assert.equal(JSON.stringify(f.summaries).includes(privateMarker), false);
  });
}

for (const [app, path, expected] of [
  ["docs", "/ko/docs", "index"],
  ["docs", "/en/category/web/js/article", "article"],
  ["docs", "/feed", "feed"],
  ["docs", "/ko/docs/", "index"],
  ["docs", "/category/web/js", "index"],
  ["vuln-radar", "/overview", "overview"],
  ["vuln-radar", "/feed", "feed"],
  ["docs", "/private/path", "other"],
]) {
  test(`document groups do not emit paths: ${app} ${expected}`, async () => {
    const f = fixture({ app });
    await f.collect(
      request(modern({ documentURL: `${origin}${path}?q=${privateMarker}` })),
    );
    assert.equal(f.summaries[0].groups[0].document, expected);
    assert.equal(JSON.stringify(f.summaries).includes(privateMarker), false);
  });
}

test("foreign, non-HTTP, malformed document URLs and unknown status stay finite", async () => {
  const f = fixture();
  for (const [url, expected] of [
    ["https://foreign.example/private", "external"],
    ["data:private", "unknown"],
    [privateMarker, "unknown"],
    [null, "unknown"],
  ]) {
    await f.collect(
      request(
        modern({
          documentURL: url,
          statusCode: privateMarker,
          disposition: undefined,
        }),
      ),
    );
    assert.equal(f.summaries.at(-1).groups[0].document, expected);
    assert.equal(f.summaries.at(-1).groups[0].status, "unknown");
    assert.equal(f.summaries.at(-1).groups[0].disposition, "unknown");
  }
});

test("unknown dispositions and directives never enter logs", async () => {
  const f = fixture();
  await f.collect(request(modern({ disposition: privateMarker })));
  await f.collect(
    request(modern({ effectiveDirective: `script-src ${privateMarker}` })),
  );
  assert.deepEqual(f.summaries, []);
});

test("only the two reporting media types and POST are accepted", async () => {
  const f = fixture();
  for (const method of ["GET", "HEAD", "PUT", "OPTIONS"]) {
    const r = await f.collect(request(modern(), {}, method));
    assert.equal(r.status, 405);
    assert.equal(r.headers.get("allow"), "POST");
  }
  for (const mime of ["application/json", "text/plain", ""])
    assert.equal(
      (await f.collect(request(modern(), { "content-type": mime }))).status,
      415,
    );
  for (const encoding of ["gzip", "br"])
    assert.equal(
      (await f.collect(request(modern(), { "content-encoding": encoding })))
        .status,
      415,
    );
  assert.equal(
    (
      await f.collect(
        request(modern(), {
          "content-type": "Application/Reports+JSON; charset=utf-8",
          "content-encoding": "identity",
        }),
      )
    ).status,
    204,
  );
});

test("empty, malformed, wrong envelopes and oversized batches do not emit", async () => {
  const f = fixture();
  for (const input of [
    "",
    "{",
    "null",
    "[]",
    "{}",
    "true",
    JSON.stringify(legacy()),
  ])
    assert.equal((await f.collect(request(input))).status, 400);
  assert.equal(
    (
      await f.collect(
        request(modern(), { "content-type": "application/csp-report" }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await f.collect(request(Array.from({ length: 11 }, () => modern()[0]))))
      .status,
    413,
  );
  assert.equal(
    (await f.collect(request(Array.from({ length: 10 }, () => modern()[0]))))
      .status,
    204,
  );
  assert.equal(f.summaries.length, 1);
  assert.equal(f.summaries[0].groups[0].count, 10);
});

test("the byte budget is enforced at the exact UTF-8 boundary without trusting Content-Length", async () => {
  const f = fixture();
  const json = JSON.stringify(modern());
  const exact =
    json + " ".repeat(CSP_REPORT_LIMITS.bytes - Buffer.byteLength(json));
  assert.equal((await f.collect(request(exact))).status, 204);
  assert.equal(
    (await f.collect(request(exact + " ", { "content-length": "1" }))).status,
    413,
  );
  assert.equal(
    (
      await f.collect(
        request(JSON.stringify(modern({ sample: "한".repeat(6000) }))),
      )
    ).status,
    413,
  );
  for (const value of ["-1", "1.5", "invalid"])
    assert.equal(
      (await f.collect(request(modern(), { "content-length": value }))).status,
      400,
    );
  assert.equal(
    (
      await f.collect(
        request(modern(), {
          "content-length": String(CSP_REPORT_LIMITS.bytes + 1),
        }),
      )
    ).status,
    413,
  );
});

test("chunked bytes and malformed UTF-8 are rejected; oversized streams are cancelled", async () => {
  const f = fixture();
  let cancelled = false;
  const tooLarge = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(8192));
      c.enqueue(new Uint8Array(8193));
    },
    cancel() {
      cancelled = true;
    },
  });
  assert.equal((await f.collect(streamed(tooLarge))).status, 413);
  assert.equal(cancelled, true);
  assert.equal(
    (
      await f.collect(
        streamed(
          new ReadableStream({
            start(c) {
              c.enqueue(new Uint8Array([0xff]));
              c.close();
            },
          }),
        ),
      )
    ).status,
    400,
  );
});

test("empty chunks cannot bypass the read budget or starve the body timeout", async () => {
  const f = fixture();
  let cancelled = false;
  const stream = new ReadableStream({
    pull(c) {
      c.enqueue(new Uint8Array());
    },
    cancel() {
      cancelled = true;
    },
  });
  assert.equal((await f.collect(streamed(stream))).status, 413);
  assert.equal(cancelled, true);
  assert.deepEqual(f.summaries, []);
});

test("slow and aborted bodies stop reading without logging raw errors", async () => {
  const f = fixture({ bodyTimeoutMs: 20 });
  let cancelled = false;
  const slow = new ReadableStream({
    cancel() {
      cancelled = true;
      return new Promise(() => {});
    },
  });
  assert.equal((await f.collect(streamed(slow))).status, 408);
  assert.equal(cancelled, true);
  const controller = new AbortController();
  const pending = f.collect(
    streamed(new ReadableStream(), { signal: controller.signal }),
  );
  controller.abort(new Error(privateMarker));
  assert.equal((await pending).status, 408);
  assert.deepEqual(f.summaries, []);
});

test("concurrent requests reserve the shared budget before reads and recover at the boundary", async () => {
  let now = 0;
  const f = fixture({ now: () => now });
  const responses = await Promise.all(
    Array.from({ length: 65 }, () => f.collect(request())),
  );
  assert.equal(responses.filter((r) => r.status === 204).length, 60);
  assert.equal(responses.filter((r) => r.status === 429).length, 5);
  assert.equal(responses.at(-1).headers.get("retry-after"), "60");
  now = 59_999;
  assert.equal((await f.collect(request())).headers.get("retry-after"), "1");
  now = 60_000;
  assert.equal((await f.collect(request())).status, 204);
});

test("invalid report traffic also spends the parsing budget and cannot forge a client key", async () => {
  const f = fixture();
  for (let i = 0; i < 60; i++)
    assert.equal((await f.collect(request("{"))).status, 400);
  assert.equal(
    (
      await f.collect(
        request(modern(), {
          "x-forwarded-for": "different",
          origin: "https://different.example",
          cookie: privateMarker,
        }),
      )
    ).status,
    429,
  );
  assert.deepEqual(f.summaries, []);
});

test("sink failures return an empty static response without serializing the exception", async () => {
  const f = fixture({
    emit() {
      throw new Error(privateMarker);
    },
  });
  const r = await f.collect(request());
  assert.equal(r.status, 503);
  assert.equal(await r.text(), "");
  assert.equal(JSON.stringify([...r.headers]).includes(privateMarker), false);
});

test("both real route adapters use the shared collector and identify their own app", async () => {
  const old = console.info;
  const emitted = [];
  console.info = (...args) => emitted.push(args);
  try {
    const docs = await import("../apps/docs/app/api/csp-report/route.ts");
    const vuln = await import("../apps/vuln-radar/api/csp-report.ts");
    assert.equal((await docs.POST(request())).status, 204);
    assert.equal((await vuln.default.fetch(request())).status, 204);
    assert.deepEqual(
      emitted.map((x) => x[1].app),
      ["docs", "vuln-radar"],
    );
    assert.equal(JSON.stringify(emitted).includes(privateMarker), false);
  } finally {
    console.info = old;
  }
});

test("SPA rewrite does not swallow the collector; other app and backend paths remain routed", () => {
  const require = createRequire(
    new URL("../apps/docs/package.json", import.meta.url),
  );
  const { pathToRegexp } = require("next/dist/compiled/path-to-regexp");
  const config = JSON.parse(
    readFileSync(
      new URL("../apps/vuln-radar/vercel.json", import.meta.url),
      "utf8",
    ),
  );
  const spa = pathToRegexp(config.rewrites.at(-1).source);
  for (const path of ["/api/csp-report", "/api/csp-report/"])
    assert.equal(spa.test(path), false);
  for (const path of ["/", "/overview", "/feed", "/api/csp-report-other"])
    assert.equal(spa.test(path), true);
  assert.equal(config.rewrites[0].destination, "/api/proxy?proxyPath=:path*");
});

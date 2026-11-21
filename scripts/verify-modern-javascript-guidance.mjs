import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import ts from "typescript";

// Synthetic examples only: no network, application startup, or configuration writes.
const root = fileURLToPath(new URL("../", import.meta.url));
const results = [];
async function check(name, run) {
  try {
    const observed = await run();
    results.push({ name, status: "pass", observed: observed ?? null });
  } catch (error) {
    results.push({ name, status: "fail", error: error.message });
  }
}

await check("abort-default-reason", () => {
  const controller = new AbortController();
  controller.abort();
  assert.equal(controller.signal.reason.name, "AbortError");
  return controller.signal.reason.name;
});
await check("timeout-reason-and-fetch-rejection", async () => {
  const signal = AbortSignal.timeout(5);
  // Keep Node alive: AbortSignal.timeout alone does not keep the event loop alive.
  const guard = setTimeout(() => {}, 1_000);
  try {
    await new Promise((resolve) =>
      signal.addEventListener("abort", resolve, { once: true }),
    );
  } finally {
    clearTimeout(guard);
  }
  assert.equal(signal.reason.name, "TimeoutError");
  await assert.rejects(fetch("data:text/plain,synthetic", { signal }), {
    name: "TimeoutError",
  });
  return { reason: signal.reason.name, fetch: "rejected before request" };
});
await check("composite-first-reason", () => {
  const first = new AbortController();
  const second = new AbortController();
  const signal = AbortSignal.any([first.signal, second.signal]);
  const reason = new Error("synthetic cancellation");
  first.abort(reason);
  second.abort(new Error("later cancellation"));
  assert.equal(signal.reason, reason);
  return "first reason retained";
});
await check("finished-work-does-not-cancel-timeout-signal", async () => {
  const signal = AbortSignal.timeout(5);
  await Promise.resolve("synthetic completed work");
  await delay(30);
  assert.equal(signal.aborted, true);
  return "signal still expires after work completes";
});
await check("timeout-alone-does-not-keep-node-alive", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      'const signal = AbortSignal.timeout(100); signal.addEventListener("abort", () => process.stdout.write("aborted"));',
    ],
    { encoding: "utf8", timeout: 5_000 },
  );
  assert.equal(output, "");
  return "child exits without waiting for timeout";
});
await check("copy-sort-preserves-source-and-order", () => {
  const routes = ["/b", "/a", "/a"];
  const sorted = routes.toSorted();
  assert.deepEqual(sorted, [...routes].sort());
  assert.deepEqual(routes, ["/b", "/a", "/a"]);
  assert.notEqual(sorted, routes);
  return sorted;
});
await check("set-conversion-is-not-array-copy", () => {
  const targets = new Set(["b", "a"]);
  assert.equal(typeof targets.toSorted, "undefined");
  assert.throws(() => targets.toSorted(), TypeError);
  assert.deepEqual([...targets].sort(), ["a", "b"]);
  assert.deepEqual([...targets], ["b", "a"]);
  return { directMethod: "absent", converted: [...targets].sort() };
});
await check("map-sort-does-not-mutate-input", () => {
  const rows = [{ href: "/b" }, { href: "/a" }];
  assert.deepEqual(rows.map((r) => r.href).sort(), ["/a", "/b"]);
  assert.deepEqual(rows, [{ href: "/b" }, { href: "/a" }]);
});
await check("array-and-typedarray-default-order-differ", () => {
  const typed = new Uint8Array([10, 2]);
  assert.deepEqual([...typed].sort(), [10, 2]);
  assert.deepEqual([...typed.toSorted()], [2, 10]);
  return { array: [...typed].sort(), typed: [...typed.toSorted()] };
});
await check("sparse-slice-and-copying-method-differ", () => {
  const sparse = [, 1];
  assert.equal(1 in sparse.slice().sort(), false);
  assert.equal(1 in sparse.toSorted(), true);
  assert.equal(1 in [...sparse].sort(), true);
  return "slice preserves holes; spread and toSorted materialize undefined";
});
await check("reverse-search-index-and-miss", () => {
  const values = ["a", "b", "a"];
  assert.equal(
    [...values].reverse().findIndex((v) => v === "a"),
    0,
  );
  assert.equal(
    values.findLastIndex((v) => v === "a"),
    2,
  );
  assert.equal(
    values.findLastIndex((v) => v === "missing"),
    -1,
  );
  return { reversedIndex: 0, originalIndex: 2, miss: -1 };
});
await check("promise-executor-is-synchronous", async () => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  assert.equal(typeof release, "function");
  release();
  await gate;
});
await check("withresolvers-gate-release-and-repeat", async () => {
  const { promise, resolve } = Promise.withResolvers();
  let opened = false;
  const consumer = promise.then(() => {
    opened = true;
  });
  await Promise.resolve();
  assert.equal(opened, false);
  resolve("first");
  resolve("second");
  await consumer;
  assert.equal(opened, true);
  assert.equal(await promise, "first");
  return "pending until release; first settlement retained";
});
await check("executor-throw-versus-external-setup-throw", async () => {
  const failure = new Error("synthetic setup failure");
  await assert.rejects(
    new Promise(() => {
      throw failure;
    }),
    (error) => error === failure,
  );
  assert.throws(
    () => {
      Promise.withResolvers();
      throw failure;
    },
    (error) => error === failure,
  );
  return "executor rejects; external setup throws synchronously";
});

const snippet = `export {};\nconst sorted = [2, 1].toSorted();\nconst gate = Promise.withResolvers<void>();\nconst signal = AbortSignal.timeout(8_000);\n`;
function diagnostics(lib) {
  const virtual = `${root}scripts/__modern_javascript_virtual__.ts`;
  const options = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    lib,
    types: [],
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (file, ...args) =>
    file === virtual
      ? ts.createSourceFile(file, snippet, ts.ScriptTarget.ES2022, true)
      : original(file, ...args);
  const program = ts.createProgram([virtual], options, host);
  return ts.getPreEmitDiagnostics(program).map((d) => ({
    code: d.code,
    message: ts.flattenDiagnosticMessageText(d.messageText, " "),
  }));
}
await check("typescript-isolated-es2022-lib", () => {
  const observed = diagnostics(["lib.es2022.d.ts", "lib.dom.d.ts"]);
  assert.equal(observed.length, 2);
  assert.ok(observed.some((d) => d.message.includes("toSorted")));
  assert.ok(observed.some((d) => d.message.includes("withResolvers")));
  return observed;
});
await check("typescript-isolated-es2024-lib-es2022-target", () => {
  const observed = diagnostics(["lib.es2024.d.ts", "lib.dom.d.ts"]);
  assert.deepEqual(observed, []);
  return observed;
});

const sourceFiles = [
  "apps/vuln-radar/src/shared/api/client.ts",
  "scripts/analyze-vuln-radar-lockfile.mts",
  "scripts/private-content-ci-policy.mts",
  "scripts/verify-vuln-radar-integration.mts",
  "packages/typescript-config/base.json",
  "tsconfig.vuln-integration.json",
  "package.json",
  ".node-version",
];
const sources = Object.fromEntries(
  sourceFiles.map((file) => [
    file,
    createHash("sha256")
      .update(readFileSync(`${root}${file}`))
      .digest("hex"),
  ]),
);
console.log(
  JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      timezone: "Asia/Seoul",
      head: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      node: process.version,
      typescript: ts.version,
      scope:
        "synthetic Node semantics and isolated TypeScript lib comparison; not browser or application regression",
      sources,
      passed: results.filter((r) => r.status === "pass").length,
      failed: results.filter((r) => r.status === "fail").length,
      results,
    },
    null,
    2,
  ),
);
if (results.some((r) => r.status === "fail")) process.exitCode = 1;

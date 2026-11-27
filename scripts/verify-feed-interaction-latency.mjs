import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { join, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(root, "apps/docs/package.json"));
const { chromium, firefox, webkit, expect } = require("@playwright/test");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    functional: { type: "boolean" },
    pilot: { type: "boolean" },
    build: { type: "boolean" },
  },
});
assert.ok(positionals.length <= 1, "Supply at most one dist directory");
const dist = resolve(
  positionals[0] ?? "/private/tmp/web-tech-inp-baseline/dist",
);
const pilot = Boolean(values.pilot);
const mode = values.functional ? "functional" : "measurement";
const requests = [];
const observations = [];
const calibrations = [];
const ownedBrowsers = [];
const sourcePaths = [
  "feed-page",
  "feed-filter-bar",
  "feed-vulnerability-card",
  "feed-pagination",
].map((name) => `apps/vuln-radar/src/pages/feed/ui/${name}.tsx`);
async function hashFiles(directory, files) {
  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => [
        file,
        createHash("sha256")
          .update(await readFile(join(directory, file)))
          .digest("hex"),
      ]),
    ),
  );
}
async function hashBundle() {
  const assets = (await readdir(join(dist, "assets"))).sort();
  return hashFiles(dist, [
    "index.html",
    ...assets.map((name) => `assets/${name}`),
  ]);
}
const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" });
const provenancePath = join(dist, "feed-verification-build.json");
if (values.build) {
  const revision = git("rev-parse", "HEAD").trim();
  const hasLocalChanges = Boolean(git("status", "--porcelain").trim());
  const sourceHashes = await hashFiles(root, sourcePaths);
  // A fresh output directory prevents mixing bundles from different builds.
  await mkdir(dist);
  const build = spawnSync(
    "pnpm",
    ["--filter", "vuln-radar", "exec", "vp", "build", "--outDir", dist],
    {
      cwd: root,
      stdio: ["ignore", 2, 2],
    },
  );
  assert.equal(build.status, 0, "Vuln Radar build failed");
  assert.equal(git("rev-parse", "HEAD").trim(), revision);
  assert.deepEqual(await hashFiles(root, sourcePaths), sourceHashes);
  await writeFile(
    provenancePath,
    JSON.stringify(
      {
        revision,
        hasLocalChanges,
        sourceHashes,
        bundleHashes: await hashBundle(),
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
}
const bundleHashes = await hashBundle();
let buildProvenance = null;
try {
  buildProvenance = JSON.parse(await readFile(provenancePath, "utf8"));
  assert.deepEqual(
    buildProvenance.bundleHashes,
    bundleHashes,
    "Bundle hashes differ from build manifest",
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const knownQuery = (q) =>
  ({
    "": "base",
    alpha: "english",
    보안: "korean",
    한글: "korean-inserted",
    보: "partial-korean",
    보안중: "korean-blur-commit",
    direct: "direct",
    alternate: "alternate",
    hold: "held",
    final: "final",
    absent: "empty",
  })[q] || "other";
const markerFor = (q, priority, page) => `${q || "base"}:${priority}:p${page}:`;
const reactControl =
  mode === "functional"
    ? (
        await require("esbuild").build({
          stdin: {
            contents:
              'import React,{useState} from "react";import{createRoot}from"react-dom/client";function Control(){const[v,set]=useState("");return React.createElement("input",{"aria-label":"react-ime-control",value:v,onChange:e=>set(e.target.value)})}createRoot(document.getElementById("root")).render(React.createElement(Control));',
            resolveDir: join(root, "apps/vuln-radar"),
            sourcefile: "synthetic-ime-control.js",
          },
          bundle: true,
          format: "esm",
          write: false,
          define: { "process.env.NODE_ENV": '"production"' },
        })
      ).outputFiles[0].contents
    : null;
let origin;
let server;
let result;

function diagnostics() {
  const d = {
    supported: PerformanceObserver.supportedEntryTypes,
    events: [],
    frames: [],
    inputs: [],
    resources: [],
    readyAt: null,
    expected: "",
    since: 0,
  };
  window.__feedDiag = d;
  const noteQuery = () => {
    if (d.ime && !d.ime.ended) {
      d.ime.urlHeld &&=
        new URL(location.href).searchParams.get("q") === d.ime.initialQuery;
    }
  };
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      noteQuery();
      return result;
    };
  }
  const fetch = window.fetch;
  window.fetch = function (input, ...rest) {
    if (d.ime) {
      const url = new URL(
        input instanceof Request ? input.url : input,
        location.href,
      );
      if (
        url.origin === location.origin &&
        url.pathname === "/api/backend/feed/search"
      ) {
        d.ime.requests.push({
          afterCommit: d.ime.ended,
          finalQuery: url.searchParams.get("q") === "보안",
        });
      }
    }
    return fetch.call(this, input, ...rest);
  };
  document.addEventListener(
    "compositionend",
    (event) => {
      if (d.ime) {
        noteQuery();
        d.ime.ended = true;
      }
    },
    true,
  );
  const numeric = (v) => (Number.isFinite(v) ? v : null);
  if (d.supported.includes("event"))
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (e.interactionId > 0)
          d.events.push({
            name: e.name,
            start: e.startTime,
            duration: e.duration,
            inputDelay: e.processingStart - e.startTime,
            processing: e.processingEnd - e.processingStart,
            presentationApprox: Math.max(
              0,
              e.startTime + e.duration - e.processingEnd,
            ),
            interactionId: e.interactionId,
          });
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  if (d.supported.includes("long-animation-frame"))
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        d.frames.push({
          start: e.startTime,
          duration: e.duration,
          blocking: e.blockingDuration,
          style: numeric(e.styleDuration),
          layout: numeric(e.layoutDuration),
          combinedRender:
            e.styleAndLayoutStart > 0
              ? Math.max(
                  0,
                  (e.paintTime || e.startTime + e.duration) -
                    e.styleAndLayoutStart,
                )
              : null,
          scripts: e.scripts.map((s) => ({
            duration: s.duration,
            forcedStyle: numeric(s.forcedStyleDuration),
            forcedLayout: numeric(s.forcedLayoutDuration),
            combinedForced: numeric(s.forcedStyleAndLayoutDuration),
            source: s.sourceURL?.includes("/assets/") ? "app-bundle" : "other",
          })),
        });
    }).observe({ type: "long-animation-frame", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      if (e.name.includes("/api/backend/feed/search")) {
        const u = new URL(e.name);
        d.resources.push({
          q: u.searchParams.get("q"),
          page: Number(u.searchParams.get("page")),
          priority: u.searchParams.get("priority"),
          start: e.startTime,
          responseStart: e.responseStart,
          responseEnd: e.responseEnd,
          duration: e.duration,
        });
      }
  }).observe({ type: "resource", buffered: true });
  for (const name of [
    "input",
    "click",
    "keydown",
    "compositionstart",
    "compositionupdate",
    "compositionend",
  ])
    addEventListener(
      name,
      (e) => {
        if (e.isTrusted)
          d.inputs.push({
            name,
            start: performance.now(),
            composing: Boolean(e.isComposing),
          });
      },
      true,
    );
  new MutationObserver(() => {
    const title = document.querySelector("article.group h2");
    if (
      d.readyAt !== null ||
      !d.expected ||
      !title?.textContent.includes(d.expected) ||
      title.closest("[inert]")
    )
      return;
    const expected = d.expected;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (d.expected === expected && d.readyAt === null)
          d.readyAt = performance.now();
      }),
    );
  }).observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
    attributeFilter: ["inert"],
  });
}
function fixture(u) {
  const q = u.searchParams.get("q") || "";
  const priority = u.searchParams.get("priority") || "all";
  const page = Number(u.searchParams.get("page") || 1);
  const total = q === "absent" ? 0 : 50;
  return {
    generatedAt: "2026-11-25T00:00:00.000Z",
    dataSource: {
      kind: "mock",
      reason: "derived_from_feed",
      message: "Synthetic diagnostic fixture",
    },
    pagination: { page, pageSize: 25, total, totalPages: total ? 2 : 0 },
    items: Array.from({ length: total ? 25 : 0 }, (_, i) => ({
      cveId: `CVE-2099-${String((page - 1) * 25 + i + 1).padStart(4, "0")}`,
      title:
        `${markerFor(q, priority, page)} fixture ${(page - 1) * 25 + i + 1} 합성 취약점`.repeat(
          (i % 3) + 1,
        ),
      priority: priority === "all" ? ["P0", "P1", "P2", "P3"][i % 4] : priority,
      severity: ["critical", "high", "medium", "low"][i % 4],
      epssScore: 0.32,
      isKev: i % 3 === 0,
      publishedAt: "2026-11-20T00:00:00.000Z",
      updatedAt: "2026-11-24T00:00:00.000Z",
      matchedWatchlist: Array.from({ length: i % 3 }, (_, j) => `fixture-${j}`),
    })),
  };
}
async function arm(page, q, priority, pageNumber) {
  await page.evaluate(
    ({ marker, ...expectedRequest }) => {
      const d = window.__feedDiag;
      d.since = performance.now();
      d.expected = marker;
      d.expectedRequest = expectedRequest;
      d.readyAt = null;
    },
    {
      marker: markerFor(q, priority, pageNumber),
      q,
      priority,
      page: pageNumber,
    },
  );
}
async function collect(page, action) {
  await page.waitForFunction(() => window.__feedDiag.readyAt !== null, null, {
    timeout: 10000,
    polling: 30,
  });
  await page.waitForTimeout(130);
  return page.evaluate((action) => {
    const d = window.__feedDiag,
      now = performance.now();
    const inputs = d.inputs.filter((e) => e.start >= d.since);
    const lastInput = inputs.filter((e) => e.name === "input").at(-1)?.start;
    const first =
      inputs.find(
        (e) => e.name === "keydown" || e.name === "click" || e.name === "input",
      )?.start ?? d.since;
    const end = d.readyAt;
    const resources = d.resources.filter((e) => e.start >= d.since);
    const expected = d.expectedRequest;
    const finalRequest = resources.findLast(
      (e) =>
        e.q === expected.q &&
        e.priority === expected.priority &&
        e.page === expected.page &&
        e.responseStart > 0 &&
        e.responseEnd <= end,
    );
    return {
      action,
      elapsedFromFirstEvent: end - first,
      elapsedFromLastInput: lastInput === undefined ? null : end - lastInput,
      lastInputToRequest:
        lastInput === undefined || !finalRequest
          ? null
          : finalRequest.start - lastInput,
      responseEndToReady: finalRequest ? end - finalRequest.responseEnd : null,
      resources: resources.map(({ q, ...r }) => ({
        ...r,
        start: r.start - d.since,
        responseStart: r.responseStart ? r.responseStart - d.since : null,
        responseEnd: r.responseEnd - d.since,
      })),
      events: d.events
        .filter((e) => e.start >= d.since && e.start <= end)
        .map((e) => ({ ...e, start: e.start - d.since })),
      frames: d.frames
        .filter((e) => e.start >= d.since && e.start <= end)
        .map((e) => ({ ...e, start: e.start - d.since })),
      eventTimingSupported: d.supported.includes("event"),
      loafSupported: d.supported.includes("long-animation-frame"),
      readyProxy: "expected DOM mutation plus two animation frames",
      inputEvents: inputs.map((e) => ({
        name: e.name,
        composing: e.composing,
      })),
      observationEnd: now - end,
    };
  }, action);
}
async function scenario(browser, engine, width, cpu, repetition) {
  const id = `${engine}-${width}-${cpu}-${repetition}`;
  const context = await browser.newContext({
    viewport: { width, height: 850 },
    extraHTTPHeaders: { "x-diagnostic-run": id },
  });
  try {
    await context.route("**/*", (route) =>
      new URL(route.request().url()).origin === origin
        ? route.continue()
        : route.abort(),
    );
    await context.addInitScript(diagnostics);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", () => errors.push("pageerror"));
    let cdp;
    if (engine === "chromium") {
      cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    }
    await page.goto(`${origin}/feed`);
    await page.locator("article.group h2").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const input = page.getByRole("textbox", { name: "피드 검색" });
    const actions = [];
    let imeResult = null;
    await input.focus();
    await arm(page, "alpha", "all", 1);
    await input.pressSequentially("alpha", { delay: 40 });
    actions.push(await collect(page, "english-typing"));
    const priority = page.getByRole("button", { name: "P1", exact: true });
    await priority.scrollIntoViewIfNeeded();
    await arm(page, "alpha", "P1", 1);
    await priority.click();
    actions.push(await collect(page, "priority-filter"));
    const next = page.getByRole("button", { name: "다음", exact: true });
    await next.scrollIntoViewIfNeeded();
    await arm(page, "alpha", "P1", 2);
    await next.click();
    actions.push(await collect(page, "next-page"));
    await input.scrollIntoViewIfNeeded();
    await input.focus();
    await input.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await arm(page, "한글", "P1", 1);
    await page.keyboard.insertText("한글");
    actions.push(await collect(page, "korean-text-insertion"));
    await arm(page, "final", "P1", 1);
    await input.fill("hold");
    await page.waitForRequest((r) => r.url().includes("q=hold"));
    await input.fill("final");
    actions.push(await collect(page, "rapid-replacement"));
    await page.waitForTimeout(80);
    assert.equal(await input.inputValue(), "final");
    assert.equal(new URL(page.url()).searchParams.get("q"), "final");
    assert.equal(await page.locator("article.group").count(), 25);
    assert.equal(errors.length, 0);
    const own = requests.filter((r) => r.id === id);
    assert.ok(own.some((r) => r.query === "held" && r.closedEarly));
    if (mode === "functional") {
      const links = page.locator("article.group a");
      await links.first().focus();
      const visited = [];
      for (let i = 0; i < 25; i++) {
        visited.push(
          await page.evaluate(() =>
            document.activeElement?.getAttribute("href"),
          ),
        );
        if (i < 24)
          await page.keyboard.press(engine === "webkit" ? "Alt+Tab" : "Tab");
      }
      assert.equal(new Set(visited).size, 25);
      assert.deepEqual(
        visited,
        await links.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("href")),
        ),
      );
      await input.fill("absent");
      await page
        .getByRole("heading", { name: "현재 조건에 맞는 취약점이 없습니다." })
        .waitFor();
      assert.equal(await page.locator("article.group").count(), 0);
      await input.fill("final");
      await page.locator("article.group h2").first().waitFor();
      if (cdp) {
        await input.focus();
        await input.press(
          process.platform === "darwin" ? "Meta+A" : "Control+A",
        );
        await page.evaluate(() => {
          window.__feedDiag.ime = {
            ended: false,
            initialQuery: new URL(location.href).searchParams.get("q"),
            urlHeld: true,
            requests: [],
          };
        });
        await cdp.send("Input.imeSetComposition", {
          text: "보",
          selectionStart: 1,
          selectionEnd: 1,
        });
        await expect(input).toHaveValue("보");
        await page.waitForTimeout(400);
        await cdp.send("Input.imeSetComposition", {
          text: "보안",
          selectionStart: 2,
          selectionEnd: 2,
        });
        await expect(input).toHaveValue("보안");
        await page.waitForTimeout(400);
        assert.deepEqual(
          await page.evaluate(() => ({
            q: new URL(location.href).searchParams.get("q"),
            requests: window.__feedDiag.ime.requests,
          })),
          { q: "final", requests: [] },
        );
        await cdp.send("Input.insertText", { text: "보안" });
        await page.waitForFunction(
          () =>
            new URL(location.href).searchParams.get("q") ===
            document.querySelector("input")?.value,
        );
        await page.waitForFunction(() =>
          document
            .querySelector("article.group h2")
            ?.textContent.includes(
              `${document.querySelector("input").value}:P1:p1:`,
            ),
        );
        const boundary = await page.evaluate(() => {
          const ime = window.__feedDiag.ime;
          window.__feedDiag.ime = null;
          return ime;
        });
        imeResult = {
          expectedMatch: (await input.inputValue()) === "보안",
          observedLength: (await input.inputValue()).length,
          queryMatchesInput:
            new URL(page.url()).searchParams.get("q") ===
            (await input.inputValue()),
          method: "CDP composition only; not OS IME",
          compositionEndObserved: boundary.ended,
          urlHeldUntilCommit:
            boundary.urlHeld && boundary.initialQuery === "final",
          requestsDuringComposition: boundary.requests.filter(
            (r) => !r.afterCommit,
          ).length,
          committedRequests: boundary.requests.filter(
            (r) => r.afterCommit && r.finalQuery,
          ).length,
        };
        assert.equal(
          imeResult.compositionEndObserved,
          true,
          JSON.stringify(boundary),
        );
        if (imeResult.expectedMatch) {
          assert.equal(imeResult.urlHeldUntilCommit, true);
          assert.equal(imeResult.requestsDuringComposition, 0);
          assert.equal(imeResult.committedRequests, 1);
          const beforeCancel = requests.length;
          await input.press("End");
          await cdp.send("Input.imeSetComposition", {
            text: "중",
            selectionStart: 1,
            selectionEnd: 1,
          });
          await cdp.send("Input.imeSetComposition", {
            text: "",
            selectionStart: 0,
            selectionEnd: 0,
          });
          await page.waitForTimeout(400);
          assert.equal(await input.inputValue(), "보안");
          assert.equal(new URL(page.url()).searchParams.get("q"), "보안");
          assert.equal(
            requests.slice(beforeCancel).filter((r) => r.id === id).length,
            0,
          );
          imeResult.cancelledWithoutRequest = true;

          const beforeBlur = requests.length;
          await cdp.send("Input.imeSetComposition", {
            text: "중",
            selectionStart: 1,
            selectionEnd: 1,
          });
          await expect(input).toHaveValue("보안중");
          const p2 = page.getByRole("button", { name: "P2", exact: true });
          await p2.click();
          await expect(page.locator("article.group h2").first()).toContainText(
            "보안중:P2:p1:",
          );
          assert.equal(await input.inputValue(), "보안중");
          const urlAfterBlur = new URL(page.url());
          assert.equal(urlAfterBlur.searchParams.get("q"), "보안중");
          assert.equal(urlAfterBlur.searchParams.get("priority"), "P2");
          assert.equal(
            requests
              .slice(beforeBlur)
              .filter((r) => r.id === id && r.query === "korean-blur-commit")
              .length,
            1,
          );
          imeResult.nativeBlurCommitAndPointerFilter = true;

          await input.focus();
          await input.evaluate((field) =>
            field.setSelectionRange(field.value.length, field.value.length),
          );
          await cdp.send("Input.imeSetComposition", {
            text: "요",
            selectionStart: 1,
            selectionEnd: 1,
          });
          await expect(input).toHaveValue("보안중요");
          const p1 = page.getByRole("button", { name: "P1", exact: true });
          await p1.focus();
          await expect(page.locator("article.group h2").first()).toContainText(
            "보안중요:P2:p1:",
          );
          await p1.press("Space");
          await expect(page.locator("article.group h2").first()).toContainText(
            "보안중요:P1:p1:",
          );
          const urlAfterKey = new URL(page.url());
          assert.equal(urlAfterKey.searchParams.get("q"), "보안중요");
          assert.equal(urlAfterKey.searchParams.get("priority"), "P1");
          await expect(input).toHaveValue("보안중요");
          imeResult.nativeBlurCommitThenKeyboardFilter = true;
        }
      }
      await page.goto(`${origin}/feed?q=direct&priority=P1&page=2`);
      await page.locator("article.group h2").first().waitFor();
      assert.equal(await input.inputValue(), "direct");
      assert.match(
        await page.locator("article.group h2").first().innerText(),
        /^direct:P1:p2:/,
      );
      await page.getByRole("button", { name: "P2", exact: true }).click();
      await page.waitForFunction(() =>
        document
          .querySelector("article.group h2")
          ?.textContent.includes("direct:P2:p1:"),
      );
      await input.fill("alternate");
      await page.waitForFunction(() =>
        document
          .querySelector("article.group h2")
          ?.textContent.includes("alternate:P2:p1:"),
      );
      await page.goBack();
      await page.waitForFunction(() =>
        document
          .querySelector("article.group h2")
          ?.textContent.includes("direct:P1:p2:"),
      );
      assert.equal(await input.inputValue(), "direct");
      assert.equal(new URL(page.url()).searchParams.get("page"), "2");
      assert.equal(errors.length, 0);
    }
    observations.push({
      engine,
      browserVersion: browser.version(),
      width,
      cpu,
      repetition,
      mode,
      actions,
      requests: requests.filter((r) => r.id === id).map(({ id, ...r }) => r),
      functional: {
        currentResult: true,
        cancelledHeldRequest: true,
        queryPreserved: true,
        continuousLinks: mode === "functional" ? 25 : null,
        emptyState: mode === "functional" ? true : null,
        directUrlAndHistory: mode === "functional" ? true : null,
        imeSimulation: imeResult,
      },
      pageerrors: errors.length,
    });
    process.stderr.write(
      `${id}: ${imeResult?.expectedMatch === false ? "non-IME passed; IME mismatch" : "passed"}\n`,
    );
  } finally {
    await context.close();
  }
}

try {
  server = createServer(async (req, res) => {
    try {
      const u = new URL(req.url, origin);
      if (u.pathname === "/react-control") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(
          '<!doctype html><div id="root"></div><script type="module" src="/react-control.js"></script>',
        );
        return;
      }
      if (u.pathname === "/react-control.js" && reactControl) {
        res.writeHead(200, { "content-type": "text/javascript" });
        res.end(reactControl);
        return;
      }
      if (u.pathname === "/calibration") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(
          "<!doctype html><button onclick=\"const start=performance.now();while(performance.now()-start<80){};this.textContent='done'\">calibrate</button><input aria-label='ime-control'>",
        );
        return;
      }
      if (u.pathname === "/api/backend/feed/search") {
        const row = {
          id: String(req.headers["x-diagnostic-run"] || "unknown"),
          query: knownQuery(u.searchParams.get("q") || ""),
          page: Number(u.searchParams.get("page")),
          priority: u.searchParams.get("priority"),
          closedEarly: false,
          configuredDelay: u.searchParams.get("q") === "hold" ? 1200 : 80,
        };
        requests.push(row);
        res.once("close", () => {
          row.closedEarly = !res.writableEnded;
        });
        setTimeout(() => {
          if (!res.destroyed) {
            res.writeHead(200, {
              "content-type": "application/json",
              "cache-control": "no-store",
            });
            res.end(JSON.stringify(fixture(u)));
          }
        }, row.configuredDelay);
        return;
      }
      if (u.pathname.startsWith("/api/")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const name = u.pathname.startsWith("/assets/")
        ? u.pathname.slice(1)
        : "index.html";
      const file = resolve(dist, name);
      if (!file.startsWith(dist + sep) || !(await stat(file)).isFile()) {
        res.writeHead(404);
        res.end();
        return;
      }
      const bytes = gzipSync(await readFile(file));
      res.writeHead(200, {
        "content-type":
          {
            ".js": "text/javascript",
            ".css": "text/css",
            ".html": "text/html",
          }[extname(file)] || "application/octet-stream",
        "content-encoding": "gzip",
        "cache-control": "no-cache",
      });
      res.end(bytes);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
  const engines =
    mode === "functional" ? { chromium, firefox, webkit } : { chromium };
  for (const [engine, type] of Object.entries(engines)) {
    const browser = await type.launch({ headless: true });
    ownedBrowsers.push(browser);
    if (engine === "chromium") {
      const context = await browser.newContext();
      try {
        await context.addInitScript(diagnostics);
        const page = await context.newPage();
        await page.goto(`${origin}/calibration`);
        await page.getByRole("button", { name: "calibrate" }).click();
        await page.waitForTimeout(200);
        const value = await page.evaluate(() => ({
          eventObserved: window.__feedDiag.events.some((e) => e.duration >= 64),
          longFrameObserved: window.__feedDiag.frames.some(
            (e) => e.duration >= 50,
          ),
        }));
        assert.equal(value.eventObserved, true);
        assert.equal(value.longFrameObserved, true);
        if (mode === "functional") {
          const control = page.getByRole("textbox", { name: "ime-control" });
          await control.focus();
          const cdp = await context.newCDPSession(page);
          await cdp.send("Input.imeSetComposition", {
            text: "보",
            selectionStart: 1,
            selectionEnd: 1,
          });
          await page.waitForTimeout(400);
          await cdp.send("Input.imeSetComposition", {
            text: "보안",
            selectionStart: 2,
            selectionEnd: 2,
          });
          await cdp.send("Input.insertText", { text: "보안" });
          value.nativeImeControlMatched =
            (await control.inputValue()) === "보안";
          await page.goto(`${origin}/react-control`);
          const reactInput = page.getByRole("textbox", {
            name: "react-ime-control",
          });
          await reactInput.focus();
          await cdp.send("Input.imeSetComposition", {
            text: "보",
            selectionStart: 1,
            selectionEnd: 1,
          });
          await page.waitForTimeout(400);
          await cdp.send("Input.imeSetComposition", {
            text: "보안",
            selectionStart: 2,
            selectionEnd: 2,
          });
          await cdp.send("Input.insertText", { text: "보안" });
          value.reactImeControlMatched =
            (await reactInput.inputValue()) === "보안";
        }
        calibrations.push(value);
      } finally {
        await context.close();
      }
    }
    try {
      for (
        let repeat = 1;
        repeat <= (pilot || mode === "functional" ? 1 : 5);
        repeat++
      )
        for (const width of pilot ? [390] : [390, 1280])
          for (const cpu of mode === "measurement" && !pilot ? [1, 4] : [1])
            await scenario(browser, engine, width, cpu, repeat);
    } finally {
      await browser.close();
    }
  }
  result = {
    executedAt: new Date().toISOString(),
    mode,
    pilot,
    apiDelayMs: 80,
    heldRequestDelayMs: 1200,
    buildProvenance,
    bundleHashes,
    calibrations,
    observations,
    scope:
      "local production build; synthetic API and automated inputs; not field INP; result readiness uses DOM plus double rAF, not a paint timestamp",
  };
} finally {
  for (const browser of ownedBrowsers) await browser.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
result.cleanup = { serverClosed: true, browsersClosed: true };
if (
  observations.some((o) => o.functional.imeSimulation?.expectedMatch === false)
)
  process.exitCode = 1;
process.stdout.write(JSON.stringify(result, null, 2) + "\n");

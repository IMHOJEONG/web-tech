import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:https";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(
  new URL("../apps/docs/package.json", import.meta.url),
);
const { chromium, firefox, webkit } = require("@playwright/test");
const marker = "SYNTHETIC_PRIVATE_HTTPS_MARKER";
const scope = new AsyncLocalStorage();
const summaries = [];
const deliveries = [];
const observations = [];
const cases = new Map();
const directory = mkdtempSync(join(tmpdir(), "web-tech-csp-https-"));
const keyPath = join(directory, "key.pem");
const certPath = join(directory, "cert.pem");
const originalInfo = console.info;
let server;
let origin;
let result;

function openssl(args, input) {
  const r = spawnSync("openssl", args, { input, maxBuffer: 1024 * 1024 });
  if (r.error || r.status !== 0) throw new Error("Local TLS setup failed");
  return r.stdout;
}
function payloadFormat(value) {
  if (Array.isArray(value) && value.some((v) => v?.type === "csp-violation"))
    return "batch";
  if (value?.["csp-report"]) return "legacy";
  if (
    value?.type === "csp-violation" &&
    value.body &&
    !Array.isArray(value.body)
  )
    return "single-modern";
  return "other";
}
function expected(mode, delivery) {
  return (
    delivery.status === 204 &&
    (mode === "legacy"
      ? delivery.payloadFormat === "legacy"
      : ["batch", "single-modern"].includes(delivery.payloadFormat))
  );
}

try {
  openssl([
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-days",
    "1",
    "-keyout",
    keyPath,
    "-out",
    certPath,
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ]);
  chmodSync(keyPath, 0o600);
  const publicKey = openssl(["x509", "-in", certPath, "-pubkey", "-noout"]);
  const pin = createHash("sha256")
    .update(openssl(["pkey", "-pubin", "-outform", "DER"], publicKey))
    .digest("base64");
  const docs = await import("../apps/docs/app/api/csp-report/route.ts");
  const vuln = await import("../apps/vuln-radar/api/csp-report.ts");
  console.info = (label, summary) => {
    if (label === "[csp-report]")
      summaries.push({ caseId: scope.getStore(), summary });
  };
  server = createServer(
    { key: readFileSync(keyPath), cert: readFileSync(certPath) },
    async (req, res) => {
      try {
        const url = new URL(req.url, origin);
        const id = url.searchParams.get("case");
        const sample = cases.get(id);
        if (!sample) {
          res.writeHead(404);
          res.end();
          return;
        }
        if (url.pathname === "/probe") {
          const endpoint = `${origin}/${sample.app}/api/csp-report?case=${id}`;
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "Content-Security-Policy-Report-Only": `script-src 'none'; img-src 'none'; ${sample.mode === "report-to" ? "report-to csp-test" : `report-uri ${endpoint}`}`,
            ...(sample.mode === "report-to"
              ? { "Reporting-Endpoints": `csp-test="${endpoint}"` }
              : {}),
          });
          res.end(
            '<!doctype html><script>window.cspProbeRan=true</script><img alt="probe" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><h1>Reporting fixture</h1>',
          );
          return;
        }
        if (
          req.method !== "POST" ||
          url.pathname !== `/${sample.app}/api/csp-report`
        ) {
          res.writeHead(404);
          res.end();
          return;
        }
        // Only synthetic loopback inputs enter this bridge; do not persist raw reports.
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384) {
            res.writeHead(413);
            res.end();
            return;
          }
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        let shape = "invalid";
        try {
          shape = payloadFormat(JSON.parse(body.toString("utf8")));
        } catch {
          /* no raw error logging */
        }
        await scope.run(id, async () => {
          const request = new Request(url, {
            method: "POST",
            headers: {
              "content-type": String(req.headers["content-type"] || ""),
            },
            body,
          });
          const response = await (sample.app === "docs"
            ? docs.POST(request)
            : vuln.default.fetch(request));
          deliveries.push({
            caseId: id,
            mediaType: String(req.headers["content-type"] || "").split(";")[0],
            payloadFormat: shape,
            status: response.status,
            encrypted: Boolean(req.socket.encrypted),
          });
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        });
      } catch {
        res.writeHead(500);
        res.end();
      }
    },
  );
  server.requestTimeout = 5000;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  origin = `https://127.0.0.1:${server.address().port}`;
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser =
      engine === "chromium" ? null : await type.launch({ headless: true });
    try {
      for (const app of ["docs", "vuln-radar"])
        for (const mode of ["report-to", "legacy"]) {
          const id = `${engine}-${app}-${mode}`;
          cases.set(id, { app, mode });
          const context =
            engine === "chromium"
              ? await type.launchPersistentContext(join(directory, id), {
                  channel: "chromium",
                  headless: true,
                  args: [
                    `--ignore-certificate-errors-spki-list=${pin}`,
                    "--short-reporting-delay",
                  ],
                })
              : await browser.newContext({ ignoreHTTPSErrors: true });
          try {
            const page = await context.newPage();
            await page.goto(`${origin}/probe?case=${id}&synthetic=${marker}`);
            const secureContext = await page.evaluate(
              () => isSecureContext && location.protocol === "https:",
            );
            const reportOnlyProbeRan = await page.evaluate(
              () => window.cspProbeRan === true,
            );
            const deadline = Date.now() + 8000;
            while (
              !deliveries.some((d) => d.caseId === id && expected(mode, d)) &&
              Date.now() < deadline
            )
              await new Promise((resolve) => setTimeout(resolve, 50));
            const received = deliveries.filter((d) => d.caseId === id);
            const logged = summaries
              .filter((s) => s.caseId === id)
              .map((s) => s.summary);
            const delivered = received.some((d) => expected(mode, d));
            observations.push({
              engine,
              browserVersion: (browser || context.browser()).version(),
              app,
              mode,
              delivered,
              secureContext,
              reportOnlyProbeRan,
              received,
              summaries: logged,
              chromiumDistribution:
                engine === "chromium" ? "new-headless" : null,
              acceleratedReportingTimer: engine === "chromium",
            });
            assert.equal(secureContext, true);
            assert.equal(reportOnlyProbeRan, true);
            assert.equal(JSON.stringify(logged).includes(marker), false);
            if (delivered)
              assert.ok(
                logged.some((s) => s.app === app && s.groups?.length),
                "Delivered probe must emit sanitized groups",
              );
            process.stderr.write(
              `${id}: ${delivered ? "delivered" : "not observed within 8s"}\n`,
            );
          } finally {
            await context.close();
          }
        }
    } finally {
      if (browser) await browser.close();
    }
  }
  result = {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
      new Date(),
    ),
    observations,
    requiredCases: 12,
    deliveredCases: observations.filter((x) => x.delivered).length,
    markerAbsentFromApplicationSummaries:
      !JSON.stringify(summaries).includes(marker),
    scope:
      "Native browser requests to actual route adapters through a local HTTPS bridge; ephemeral self-signed certificate; not platform deployment or public CA validation",
    timing:
      "Chromium new-headless uses test-only short-reporting-delay; 8s observation window is not production latency",
  };
  if (observations.length !== 12 || observations.some((x) => !x.delivered))
    process.exitCode = 1;
} finally {
  console.info = originalInfo;
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  rmSync(directory, { recursive: true, force: true });
}
result.cleanup = {
  serverClosed: true,
  temporaryDirectoryRemoved: !existsSync(directory),
  systemTrustChanged: false,
};
process.stdout.write(JSON.stringify(result, null, 2) + "\n");

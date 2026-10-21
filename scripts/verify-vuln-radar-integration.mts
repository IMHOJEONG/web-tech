import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { format, resolveConfig } from "prettier";
import type { Browser, Page } from "@playwright/test";
import type { PrismaClient } from "../apps/vuln-radar-backend/generated/prisma/index.js";
import deploymentProxy from "../apps/vuln-radar/api/proxy.ts";
import { finishVerification } from "./verification-cleanup.mts";

const root = fileURLToPath(new URL("../", import.meta.url));
const backendDir = join(root, "apps/vuln-radar-backend");
const frontendDir = join(root, "apps/vuln-radar");
const backendRequire = createRequire(join(backendDir, "package.json"));
const frontendRequire = createRequire(join(frontendDir, "package.json"));
const browserRequire = createRequire(join(root, "apps/docs/package.json"));
const { chromium, expect } = browserRequire(
  "@playwright/test",
) as typeof import("@playwright/test");
const { PrismaPg } = backendRequire(
  "@prisma/adapter-pg",
) as typeof import("@prisma/adapter-pg");
const GeneratedPrisma = backendRequire("./generated/prisma/index.js")
  .PrismaClient as typeof PrismaClient;
const backendOrigin = "http://127.0.0.1:4310";
const frontendOrigin = "http://127.0.0.1:4311";
const image = "postgres:16-alpine";
const runId = randomUUID();
const container = `heap-forge-vuln-integration-${runId}`;
const token = randomBytes(32).toString("hex");
const password = randomBytes(24).toString("hex");
const privateValues = [token, password];
const redact = (value: string) =>
  privateValues.reduce(
    (text, secret) => text.split(secret).join("[redacted]"),
    value,
  );
const results: Array<{
  name: string;
  status: "passed" | "failed";
  durationMs: number;
}> = [];
const startedAt = new Date().toISOString();
const artifactStamp = startedAt.replace(/[:.]/g, "-");
const artifacts = join(
  root,
  `docs/verification/artifacts/${artifactStamp}-vuln-radar-integration.json`,
);
let interrupted = false;
let temp = "";
let dockerCreated = false;
let backend: ChildProcess | undefined;
let frontend: ChildProcess | undefined;
let browser: Browser | undefined;
let prisma: PrismaClient | undefined;
let backendEnv: NodeJS.ProcessEnv;
let mode = "database";
const logs: string[] = [];
let fatal: string | undefined;
let fixtureSummary: unknown;
let browserVersion: string | undefined;
let browserCredentialLeaks = 0;
const browserErrors: string[] = [];
const screenshots: Record<string, string> = {};
/** Executes bounded local commands, redacting credentials from failure messages. */
function command(bin: string, args: string[], cwd = root, env = process.env) {
  const result = spawnSync(bin, args, {
    cwd,
    env,
    encoding: "utf8",
    timeout: 120_000,
  });
  if (result.status !== 0) {
    throw new Error(
      redact(
        `${bin} ${args.join(" ")} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`,
      ),
    );
  }
  return result.stdout.trim();
}

/** Records one assertion group before propagating a failure to the run report. */
async function check(name: string, task: () => Promise<void>) {
  const start = performance.now();
  try {
    assert.ok(!interrupted, "Integration verification interrupted");
    await task();
    results.push({
      name,
      status: "passed",
      durationMs: Math.round(performance.now() - start),
    });
    console.log(`[PASS] ${name}`);
  } catch (error) {
    results.push({
      name,
      status: "failed",
      durationMs: Math.round(performance.now() - start),
    });
    throw error;
  }
}

/** Tracks only children created by this run and retains bounded, redacted logs. */
function launch(args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on("data", (data: Buffer) => {
      logs.push(redact(data.toString()));
      if (logs.length > 100) logs.shift();
    });
  }
  return child;
}

/** Stops an owned child within a bounded grace period; never searches for other PIDs. */
async function stop(child: ChildProcess | undefined) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  for (
    let i = 0;
    i < 30 && child.exitCode === null && child.signalCode === null;
    i++
  )
    await delay(100);
  if (child.exitCode === null && child.signalCode === null)
    child.kill("SIGKILL");
  for (
    let i = 0;
    i < 20 && child.exitCode === null && child.signalCode === null;
    i++
  )
    await delay(100);
  assert.ok(
    child.exitCode !== null || child.signalCode !== null,
    "Owned process did not stop",
  );
}

/** Waits for the owned server with bounded requests and interrupt awareness. */
async function ready(url: string, child: ChildProcess) {
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.ok(!interrupted, "Integration verification interrupted");
    assert.ok(
      child.exitCode === null && child.signalCode === null,
      `Server exited before ${url}`,
    );
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
    } catch {
      /* Wait for this run's server, not an unrelated process. */
    }
    await delay(100);
  }
  throw new Error(`Server readiness timed out: ${url}`);
}

/** Starts actual Nest modules on loopback and rejects an unexpected mock fallback. */
async function startBackend(database: boolean) {
  mode = database ? "database" : "mock";
  // Use the actual compiled module/bootstrap, but bind this verification server to loopback only.
  backend = launch(
    [
      "-e",
      `
    const { NestFactory } = require('@nestjs/core');
    const { AppModule } = require('./dist/src/app.module.js');
    const { applyAppBootstrap } = require('./dist/src/bootstrap/app-bootstrap.js');
    NestFactory.create(AppModule).then(async app => {
      applyAppBootstrap(app);
      await app.listen(4310, '127.0.0.1');
    }).catch(() => process.exit(1));
  `,
    ],
    backendDir,
    {
      ...backendEnv,
      DATABASE_URL: database ? backendEnv.DATABASE_URL : "",
      DIRECT_URL: database ? backendEnv.DIRECT_URL : "",
    },
  );
  await ready(`${backendOrigin}/api/health`, backend);
  const health = await (await fetch(`${backendOrigin}/api/health`)).json();
  assert.equal(
    health.storage,
    mode,
    "A database test must never silently pass using mock fallback",
  );
}

/** Checks real API responses without exposing the injected server token in evidence. */
async function api(path: string, proxy = false) {
  const response = await fetch(
    proxy
      ? `${frontendOrigin}/api/backend/${path}`
      : `${backendOrigin}/api/${path}`,
    {
      headers: proxy ? {} : { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  assert.equal(response.status, 200, `${path}: status`);
  const text = await response.text();
  assert.ok(!text.includes(token), "Token leaked in API body");
  return JSON.parse(text);
}

/** Invokes the deployment handler locally, restoring its temporary environment overrides. */
async function deploymentResponse(path: string, authorization?: string) {
  const previousOrigin = process.env.VULN_RADAR_BACKEND_ORIGIN;
  const previousToken = process.env.VULN_RADAR_BACKEND_API_TOKEN;
  process.env.VULN_RADAR_BACKEND_ORIGIN = backendOrigin;
  process.env.VULN_RADAR_BACKEND_API_TOKEN = token;
  const headers = new Headers();
  let status = 200;
  let body: string | Uint8Array | undefined;
  const response = {
    setHeader(name: string, value: string | string[]) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    },
    status(code: number) {
      status = code;
      return response;
    },
    send(value?: string | Uint8Array) {
      body = value;
    },
  };
  try {
    const url = new URL("/api/proxy", frontendOrigin);
    url.searchParams.set("proxyPath", path);
    await deploymentProxy(
      new Request(url, {
        headers: authorization ? { Authorization: authorization } : undefined,
      }),
      response,
    );
    const text =
      typeof body === "string" ? body : new TextDecoder().decode(body);
    assert.ok(!text.includes(token), "Deployment handler leaked the token");
    return { status, headers, json: JSON.parse(text) };
  } finally {
    if (previousOrigin === undefined)
      delete process.env.VULN_RADAR_BACKEND_ORIGIN;
    else process.env.VULN_RADAR_BACKEND_ORIGIN = previousOrigin;
    if (previousToken === undefined)
      delete process.env.VULN_RADAR_BACKEND_API_TOKEN;
    else process.env.VULN_RADAR_BACKEND_API_TOKEN = previousToken;
  }
}

/** Creates a browser page that blocks external traffic and observes credential leaks. */
async function page() {
  assert.ok(browser);
  const current = await browser.newPage();
  current.on("pageerror", (error) => browserErrors.push(redact(error.message)));
  // Never replace API responses: normal browser traffic traverses the real Vite proxy and Nest server.
  await current.route("**/*", (route) =>
    new URL(route.request().url()).hostname === "127.0.0.1"
      ? route.continue()
      : route.abort(),
  );
  current.on("request", (request) => {
    if (
      JSON.stringify(request.headers()).includes(token) ||
      request.url().includes(token)
    )
      browserCredentialLeaks++;
  });
  return current;
}

const ids = {
  alpha: "CVE-2099-91001",
  beta: "CVE-2099-91002",
  gamma: "CVE-2099-91003",
};
const warning =
  "최신 정보를 가져오지 못해 마지막으로 불러온 목록을 표시합니다. 잠시 후 다시 시도해 주세요.";
const fullError = "취약점 피드를 불러오지 못했습니다.";
let outagePage: Page | undefined;

/** Builds isolated services and exercises real database, proxy, browser and outage flows. */
async function main() {
  assert.equal(
    process.versions.node.split(".")[0],
    "24",
    "Use repository Node 24",
  );
  for (const port of [4310, 4311]) {
    const { createServer } = await import("node:net");
    const probe = createServer();
    await new Promise<void>((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(port, "127.0.0.1", resolve);
    });
    await new Promise<void>((resolve, reject) =>
      probe.close((error) => (error ? reject(error) : resolve())),
    );
  }
  temp = await mkdtemp(join(tmpdir(), "heap-forge-vuln-integration-"));
  await writeFile(
    join(temp, "postgres.env"),
    `POSTGRES_PASSWORD=${password}\nPOSTGRES_DB=integration_fixture\n`,
    { mode: 0o600 },
  );
  command("docker", [
    "run",
    "--pull=never",
    "--rm",
    "-d",
    "--name",
    container,
    "--label",
    `heap-forge.verification=${runId}`,
    "--env-file",
    join(temp, "postgres.env"),
    "-p",
    "127.0.0.1::5432",
    "--tmpfs",
    "/var/lib/postgresql/data:rw,noexec,nosuid,size=128m",
    image,
  ]);
  dockerCreated = true;
  const databasePort = command("docker", ["port", container, "5432/tcp"])
    .split(":")
    .at(-1);
  assert.ok(databasePort && /^\d+$/.test(databasePort));
  for (let attempt = 0; ; attempt++) {
    assert.ok(!interrupted, "Integration verification interrupted");
    const result = spawnSync(
      "docker",
      [
        "exec",
        container,
        "pg_isready",
        "-U",
        "postgres",
        "-d",
        "integration_fixture",
      ],
      { stdio: "ignore" },
    );
    if (result.status === 0) break;
    assert.ok(attempt < 100, "Postgres readiness timed out");
    await delay(100);
  }
  const databaseUrl = `postgresql://postgres:${password}@127.0.0.1:${databasePort}/integration_fixture`;
  backendEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DIRECT_URL: databaseUrl,
    SHADOW_DATABASE_URL: "",
    VULN_RADAR_API_TOKEN: token,
    INGEST_SCHEDULER_ENABLED: "false",
    INGEST_SYNC_ON_STARTUP: "false",
    NVD_API_KEY: "",
    APP_ENV: "integration",
    NODE_ENV: "test",
    PORT: "4310",
    CORS_ORIGIN: frontendOrigin,
    FRONTEND_ORIGIN: frontendOrigin,
  };
  command(
    process.execPath,
    [
      join(
        dirname(backendRequire.resolve("@nestjs/cli/package.json")),
        "bin/nest.js",
      ),
      "build",
    ],
    backendDir,
    backendEnv,
  );
  command(
    process.execPath,
    [
      join(
        dirname(backendRequire.resolve("prisma/package.json")),
        "build/index.js",
      ),
      "db",
      "push",
    ],
    backendDir,
    backendEnv,
  );
  prisma = new GeneratedPrisma({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  const now = new Date();
  for (const [cveId, title, priority, severity, isKev, offset] of [
    [
      ids.alpha,
      "Integration alpha critical fixture",
      "P0",
      "critical",
      true,
      1_000,
    ],
    [
      ids.beta,
      "Integration beta incomplete fixture",
      "P2",
      "high",
      false,
      2_000,
    ],
    [
      ids.gamma,
      "Integration gamma watchlist fixture",
      "P1",
      "medium",
      false,
      3_000,
    ],
  ] as const) {
    await prisma.vulnerability.create({
      data: {
        cveId,
        title,
        priority,
        severity,
        isKev,
        description:
          "Synthetic isolated integration fixture, not a real advisory.",
        publishedAt: now,
        lastModifiedAt: new Date(now.getTime() - offset),
        cvssScore: cveId === ids.beta ? null : 9.8,
        epssScore: cveId === ids.beta ? null : 0.8,
        epssPercentile: cveId === ids.beta ? null : 0.98,
        riskScore: isKev ? 95 : 30,
        ...(cveId === ids.beta
          ? {}
          : {
              watchMatches: {
                create: {
                  matchedValue: `integration-${isKev ? "alpha" : "gamma"}`,
                  watchlistEntry: {
                    create: {
                      type: "product",
                      value: `integration-${isKev ? "alpha" : "gamma"}`,
                    },
                  },
                },
              },
            }),
        ...(isKev
          ? {
              advisories: {
                create: {
                  source: "cisa-kev",
                  externalId: "synthetic-kev",
                  title: "Integration fixture advisory",
                  sourceUrl: "https://example.invalid/synthetic",
                  publishedAt: now,
                  lastModifiedAt: now,
                },
              },
            }
          : {}),
      },
    });
  }
  await startBackend(true);
  const vite = join(
    dirname(frontendRequire.resolve("vite/package.json")),
    "bin/vite.js",
  );
  const frontendEnv = {
    ...process.env,
    VULN_RADAR_BACKEND_ORIGIN: backendOrigin,
    VULN_RADAR_BACKEND_API_TOKEN: token,
    VITE_API_BASE_PATH: "/api/backend",
    VITE_APP_TITLE: "Global Vuln Radar",
    VITE_DEFAULT_ROUTE: "/overview",
    PATH: process.env.PATH,
  };
  command(
    process.execPath,
    [vite, "build", "--outDir", join(temp, "frontend")],
    frontendDir,
    frontendEnv,
  );
  await check(
    "server API token is absent from built browser assets",
    async () => {
      const assetsDir = join(temp, "frontend/assets");
      for (const asset of await readdir(assetsDir)) {
        if (/\.(js|css)$/.test(asset))
          assert.ok(
            !(await readFile(join(assetsDir, asset), "utf8")).includes(token),
            "Server token leaked into browser assets",
          );
      }
    },
  );
  frontend = launch(
    [
      vite,
      "preview",
      "--host",
      "127.0.0.1",
      "--port",
      "4311",
      "--strictPort",
      "--outDir",
      join(temp, "frontend"),
    ],
    frontendDir,
    frontendEnv,
  );
  await ready(frontendOrigin, frontend);
  browser = await chromium.launch();
  browserVersion = browser.version();

  await check(
    "actual Nest auth rejects absent and invalid tokens; real proxy supplies server token",
    async () => {
      const attempts: Record<string, string>[] = [
        {},
        { Authorization: "Bearer invalid-fixture" },
      ];
      for (const headers of attempts) {
        assert.equal(
          (await fetch(`${backendOrigin}/api/feed`, { headers })).status,
          401,
        );
      }
      assert.equal((await api("feed", true)).dataSource.kind, "database");
    },
  );
  await check(
    "Postgres feed/detail reliability and supporting endpoints match frontend contracts",
    async () => {
      const feed = await api("feed", true);
      assert.equal(feed.items.length, 3);
      const alpha = feed.items.find(
        (item: { cveId: string }) => item.cveId === ids.alpha,
      );
      const beta = feed.items.find(
        (item: { cveId: string }) => item.cveId === ids.beta,
      );
      assert.equal(alpha.reliability.level, "high");
      assert.equal(alpha.reliability.freshness.status, "fresh");
      assert.equal(beta.reliability.level, "low");
      assert.ok(beta.reliability.evidenceCompleteness.missing.includes("kev"));
      const detail = await api(`vulnerabilities/${ids.alpha}`, true);
      assert.deepEqual(detail.item.reliability, alpha.reliability);
      assert.equal(detail.item.advisories[0].source, "cisa-kev");
      for (const endpoint of ["overview", "kev", "watchlist", "ingest/status"])
        await api(endpoint, true);
      assert.equal(
        (
          await fetch(
            `${frontendOrigin}/api/backend/vulnerabilities/CVE-2099-99999`,
          )
        ).status,
        404,
      );
      fixtureSummary = {
        count: 3,
        items: feed.items.map(
          (item: { cveId: string; reliability: unknown }) => ({
            cveId: item.cveId,
            reliability: item.reliability,
          }),
        ),
      };
    },
  );

  await check(
    "deployment proxy handler maps rewritten feed/detail paths and preserves backend 401",
    async () => {
      const feed = await deploymentResponse("feed");
      assert.equal(feed.status, 200);
      assert.equal(feed.json.dataSource.kind, "database");
      assert.equal(feed.json.items.length, 3);
      const detail = await deploymentResponse(`vulnerabilities/${ids.alpha}`);
      assert.equal(detail.status, 200);
      assert.equal(detail.json.item.cveId, ids.alpha);
      assert.equal(
        (await deploymentResponse("feed", "Bearer invalid-fixture")).status,
        401,
      );
    },
  );

  await check(
    "overview parses all six real API contracts and renders the KEV matrix",
    async () => {
      const current = await page();
      try {
        await current.goto(`${frontendOrigin}/overview`);
        await expect(
          current.getByRole("heading", {
            name: "Global Vuln Radar",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          current.getByRole("heading", {
            name: "KNOWN EXPLOITED VULNERABILITIES (KEV) MATRIX",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          current.getByRole("heading", {
            name: "대시보드 데이터를 불러오지 못했습니다.",
            exact: true,
          }),
        ).toHaveCount(0);
        const refreshed = current.waitForResponse(
          (response) =>
            response.url().endsWith("/api/backend/overview") &&
            response.status() === 200,
        );
        await current
          .getByRole("button", { name: "새로고침", exact: true })
          .click();
        await refreshed;
        await expect(
          current.getByRole("button", { name: "새로고침", exact: true }),
        ).toBeEnabled();
      } finally {
        await current.close();
      }
    },
  );

  for (const width of [1280, 390]) {
    await check(
      `real API browser feed filters, labels and detail navigation at ${width}px`,
      async () => {
        const current = await page();
        try {
          await current.setViewportSize({ width, height: 900 });
          await current.goto(`${frontendOrigin}/feed`);
          await expect(
            current.getByText(ids.beta, { exact: true }),
          ).toBeVisible();
          const screenshot = `${artifactStamp}-vuln-radar-feed-${width}.png`;
          await current.screenshot({
            path: join(root, "docs/verification/artifacts", screenshot),
            fullPage: true,
          });
          screenshots[String(width)] = screenshot;
          for (const label of ["우선순위", "심각도", "KEV"])
            await expect(
              current.getByRole("group", { name: label, exact: true }),
            ).toBeVisible();
          await current.getByRole("textbox").fill("kev");
          await expect(
            current.getByText(ids.alpha, { exact: true }),
          ).toBeVisible();
          await expect(
            current.getByText(ids.beta, { exact: true }),
          ).toHaveCount(0);
          await expect(
            current.getByText(ids.gamma, { exact: true }),
          ).toHaveCount(0);
          await current.getByRole("textbox").fill("beta");
          await expect(
            current.getByText(ids.beta, { exact: true }),
          ).toBeVisible();
          await current.getByRole("textbox").fill("");
          const priority = current.getByRole("group", {
            name: "우선순위",
            exact: true,
          });
          await priority
            .getByRole("button", { name: "P0", exact: true })
            .focus();
          await current.keyboard.press("Space");
          await expect(
            priority.getByRole("button", { name: "P0", exact: true }),
          ).toHaveAttribute("aria-pressed", "true");
          await expect(
            current.getByText(ids.beta, { exact: true }),
          ).toHaveCount(0);
          const severity = current.getByRole("group", {
            name: "심각도",
            exact: true,
          });
          await severity
            .getByRole("button", { name: "HIGH", exact: true })
            .click();
          await expect(
            current.getByRole("heading", {
              name: "현재 조건에 맞는 취약점이 없습니다.",
              exact: true,
            }),
          ).toBeVisible();
          await severity
            .getByRole("button", { name: "전체", exact: true })
            .click();
          await priority
            .getByRole("button", { name: "전체", exact: true })
            .click();
          await current
            .getByRole("group", { name: "KEV", exact: true })
            .getByRole("button", { name: "KEV만", exact: true })
            .click();
          await expect(
            current.getByText(ids.beta, { exact: true }),
          ).toHaveCount(0);
          assert.ok(
            await current.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await current
            .getByRole("link", { name: "상세 정보", exact: true })
            .click();
          await expect(
            current.getByRole("heading", {
              name: "Integration alpha critical fixture",
              exact: true,
            }),
          ).toBeVisible();
          await current.reload();
          await expect(
            current.getByRole("heading", {
              name: "Integration alpha critical fixture",
              exact: true,
            }),
          ).toBeVisible();
        } finally {
          await current.close();
        }
      },
    );
  }
  await check(
    "overview counts all 43 database rows while feed stays limited to 25; browser refresh uses aggregates",
    async () => {
      assert.ok(prisma);
      const extraIds = Array.from(
        { length: 40 },
        (_, index) => `CVE-2098-${String(index).padStart(5, "0")}`,
      );
      const current = await page();
      try {
        await prisma.vulnerability.createMany({
          data: extraIds.map((cveId, index) => ({
            cveId,
            title: "Synthetic overview count fixture",
            description: "Isolated test data, not a real vulnerability.",
            priority:
              index < 30
                ? ("P0" as const)
                : index < 35
                  ? ("P1" as const)
                  : index < 38
                    ? ("P2" as const)
                    : ("P3" as const),
            isKev: index < 35,
            publishedAt: now,
            lastModifiedAt: now,
          })),
        });
        await prisma.advisory.create({
          data: {
            vulnerabilityCveId: ids.alpha,
            source: "cisa-kev",
            externalId: "overview-count-duplicate-advisory",
          },
        });
        const feed = await api("feed", true);
        assert.equal(feed.items.length, 25);
        assert.ok(
          feed.items.every(
            (item: { priority: string }) => item.priority === "P0",
          ),
        );
        const overview = await api("overview", true);
        const counts = Object.fromEntries(
          overview.cards.map((card: { id: string; value: number }) => [
            card.id,
            card.value,
          ]),
        );
        assert.deepEqual(counts, {
          "p0-open": 31,
          "p1-open": 6,
          "kev-new": 36,
          "total-vulnerabilities": 43,
        });
        assert.equal(overview.dataSource.reason, "live_read_model");
        for (const width of [1280, 390]) {
          await current.setViewportSize({ width, height: 900 });
          await current.goto(`${frontendOrigin}/overview`);
          await expect(current.getByText("43", { exact: true })).toHaveCount(2);
          await expect(current.getByText("31", { exact: true })).toBeVisible();
          await expect(
            current.getByText(
              "KEV 매치 36건과 우선 점검 P1 6건을 함께 추적합니다.",
              { exact: true },
            ),
          ).toBeVisible();
          await expect(
            current.getByText(
              "통계는 전체 저장 데이터 기준입니다. 목록은 우선순위순 상위 25건 중 일부를 보여줍니다.",
              { exact: true },
            ),
          ).toBeVisible();
        }
        await prisma.vulnerability.update({
          where: { cveId: extraIds[0] },
          data: { priority: "P1" },
        });
        const refreshed = current.waitForResponse(
          (response) =>
            response.url().endsWith("/api/backend/overview") &&
            response.status() === 200,
        );
        await current
          .getByRole("button", { name: "새로고침", exact: true })
          .click();
        await refreshed;
        await expect(current.getByText("30", { exact: true })).toBeVisible();
        await expect(
          current.getByText(
            "KEV 매치 36건과 우선 점검 P1 7건을 함께 추적합니다.",
            { exact: true },
          ),
        ).toBeVisible();
        fixtureSummary = {
          initial: fixtureSummary,
          aggregateRegression: {
            databaseRows: 43,
            feedRows: feed.items.length,
            limitedFeedCounts: {
              p0: feed.items.filter(
                (item: { priority: string }) => item.priority === "P0",
              ).length,
              p1: feed.items.filter(
                (item: { priority: string }) => item.priority === "P1",
              ).length,
              kev: feed.items.filter((item: { isKev: boolean }) => item.isKev)
                .length,
            },
            counts,
            duplicateKevAdvisory: true,
            refreshedP0: 30,
            refreshedP1: 7,
          },
        };
      } finally {
        await current.close();
        await prisma.advisory.deleteMany({
          where: { externalId: "overview-count-duplicate-advisory" },
        });
        await prisma.vulnerability.deleteMany({
          where: { cveId: { in: extraIds } },
        });
      }
    },
  );
  await check(
    "KEV rows use their own nullable EPSS outside the limited feed and show priority instead of workflow status",
    async () => {
      assert.ok(prisma);
      const fillerIds = Array.from(
        { length: 26 },
        (_, index) => `CVE-2097-${10000 + index}`,
      );
      const evidenceIds = [
        "CVE-2097-20000",
        "CVE-2097-20001",
        "CVE-2097-20002",
      ];
      const current = await page();
      try {
        await prisma.vulnerability.createMany({
          data: fillerIds.map((cveId) => ({
            cveId,
            title: "Synthetic non-KEV filler",
            description: "Isolated fixture",
            priority: "P0",
            publishedAt: now,
            lastModifiedAt: now,
          })),
        });
        for (const [index, epssScore] of [0, null, 0.125].entries()) {
          await prisma.vulnerability.create({
            data: {
              cveId: evidenceIds[index]!,
              title: `Synthetic KEV evidence ${index}`,
              description: "Isolated fixture",
              priority: "P1",
              isKev: true,
              epssScore,
              publishedAt: now,
              lastModifiedAt: now,
              advisories: {
                create: {
                  source: "cisa-kev",
                  externalId: `synthetic-kev-evidence-${index}`,
                  publishedAt: new Date(now.getTime() + 1000 + index),
                },
              },
            },
          });
        }
        await prisma.advisory.create({
          data: {
            vulnerabilityCveId: evidenceIds[0]!,
            source: "cisa-kev",
            externalId: "synthetic-kev-evidence-duplicate",
            publishedAt: new Date(now.getTime() + 2000),
          },
        });
        const feed = await api("feed", true);
        assert.equal(feed.items.length, 25);
        assert.ok(
          feed.items.every(
            (item: { cveId: string }) => !evidenceIds.includes(item.cveId),
          ),
        );
        const kev = await api("kev", true);
        const scores = evidenceIds.map(
          (cveId) =>
            kev.items.find((item: { cveId: string }) => item.cveId === cveId)
              ?.epssScore,
        );
        assert.deepEqual(scores, [0, null, 0.125]);
        for (const width of [1280, 390]) {
          await current.setViewportSize({ width, height: 900 });
          await current.goto(`${frontendOrigin}/overview`);
          const table = current.getByRole("table");
          await expect(
            table.getByRole("columnheader", { name: "우선순위", exact: true }),
          ).toBeVisible();
          const row = (cveId: string) =>
            table.getByRole("row").filter({ hasText: cveId });
          await expect(row(evidenceIds[0]!)).toHaveCount(1);
          await expect(
            row(evidenceIds[0]!).getByRole("cell").nth(2),
          ).toHaveText("0");
          await expect(row(evidenceIds[0]!).getByRole("meter")).toHaveAttribute(
            "aria-valuenow",
            "0",
          );
          await expect(
            row(evidenceIds[0]!).getByRole("meter").locator("span"),
          ).toHaveAttribute("style", "width: 0%;");
          await expect(
            row(evidenceIds[1]!).getByRole("cell").nth(2),
          ).toHaveText("미확인");
          await expect(row(evidenceIds[1]!).getByRole("meter")).toHaveCount(0);
          await expect(
            row(evidenceIds[2]!).getByRole("cell").nth(2),
          ).toHaveText("0.125");
          await expect(
            row(evidenceIds[2]!).getByRole("cell").nth(3),
          ).toHaveText("P1");
          await expect(table).not.toContainText(
            /Investigating|Monitoring|Escalated|Queued/,
          );
          const screenshot = `${artifactStamp}-vuln-radar-kev-${width}.png`;
          await current.screenshot({
            path: join(root, "docs/verification/artifacts", screenshot),
            fullPage: true,
          });
          screenshots[`kev-${width}`] = screenshot;
        }
        await current.route("**/api/backend/kev", (route) =>
          route.fulfill({
            json: {
              ...kev,
              items: kev.items.map((item: Record<string, unknown>) => {
                const { epssScore: _score, ...legacy } = item;
                return legacy;
              }),
            },
          }),
        );
        await current.reload();
        await expect(
          current
            .getByRole("table")
            .getByRole("row")
            .filter({ hasText: ids.alpha })
            .getByRole("cell")
            .nth(2),
        ).toHaveText("미확인");
        await expect(current.getByRole("meter")).toHaveCount(0);
        await current.unroute("**/api/backend/kev");
        await current.route("**/api/backend/kev", (route) =>
          route.fulfill({
            json: { ...kev, items: [{ ...kev.items[0], epssScore: 2 }] },
          }),
        );
        await current.reload();
        await expect(
          current.getByText("KEV 목록을 확인하지 못했습니다.", { exact: true }),
        ).toBeVisible();
        await expect(current.getByRole("meter")).toHaveCount(0);
        await current.unroute("**/api/backend/kev");
        await current.route("**/api/backend/kev", (route) =>
          route.fulfill({
            status: 503,
            json: { error: "synthetic KEV failure" },
          }),
        );
        await current.reload();
        await expect(
          current.getByText("KEV 목록을 확인하지 못했습니다.", { exact: true }),
        ).toBeVisible();
        await expect(current.getByRole("table").getByRole("link")).toHaveCount(
          0,
        );
        fixtureSummary = {
          statistics: fixtureSummary,
          kevEvidence: {
            outsideFeed: true,
            scores,
            duplicateAdvisoryRowsDeduplicated: true,
            legacyUnknown: true,
            outOfRangeRejected: true,
            failureNotReplacedWithFeed: true,
          },
        };
      } finally {
        await current.close();
        await prisma.vulnerability.deleteMany({
          where: { cveId: { in: [...fillerIds, ...evidenceIds] } },
        });
      }
    },
  );
  await check(
    "backend shutdown preserves browser cache through scheduled refresh failure",
    async () => {
      outagePage = await page();
      await outagePage.clock.install();
      await outagePage.goto(`${frontendOrigin}/feed`);
      await expect(
        outagePage.getByText(ids.alpha, { exact: true }),
      ).toBeVisible();
      await outagePage.getByRole("textbox").fill("integration");
      let failures = 0;
      outagePage.on("response", (response) => {
        if (
          response.url().endsWith("/api/backend/feed") &&
          response.status() >= 500
        )
          failures++;
      });
      await stop(backend);
      const deploymentFailure = await deploymentResponse("feed");
      assert.equal(deploymentFailure.status, 502);
      assert.equal(deploymentFailure.json.status, "error");
      await outagePage.clock.runFor(60_100);
      await expect.poll(() => failures).toBe(1);
      await outagePage.clock.runFor(2_000);
      await expect.poll(() => failures).toBe(2);
      await expect(outagePage.getByRole("status")).toHaveText(warning);
      await expect(
        outagePage.getByText(ids.alpha, { exact: true }),
      ).toBeVisible();
      await expect(outagePage.getByRole("textbox")).toHaveValue("integration");
      await expect(
        outagePage.getByRole("heading", { name: fullError, exact: true }),
      ).toHaveCount(0);
    },
  );
  await check(
    "first request during a real backend outage renders full error without cache",
    async () => {
      const current = await page();
      try {
        await current.goto(`${frontendOrigin}/feed`);
        await expect(
          current.getByRole("heading", { name: fullError, exact: true }),
        ).toBeVisible();
        await expect(current.getByRole("textbox")).toHaveCount(0);
      } finally {
        await current.close();
      }
    },
  );
  await check(
    "restarted Nest server rereads changed DB record and browser retry recovers",
    async () => {
      assert.ok(prisma && outagePage);
      await prisma.vulnerability.update({
        where: { cveId: ids.alpha },
        data: { title: "Integration alpha recovered fixture" },
      });
      await startBackend(true);
      await outagePage
        .getByRole("button", { name: "다시 시도", exact: true })
        .click();
      await expect(
        outagePage.getByRole("heading", {
          name: "Integration alpha recovered fixture",
          exact: true,
        }),
      ).toBeVisible();
      await expect(outagePage.getByRole("status")).toHaveCount(0);
      await expect(outagePage.getByRole("textbox")).toHaveValue("integration");
      await outagePage.close();
      outagePage = undefined;
    },
  );
  await check(
    "connected empty Postgres returns real zero overview statistics without mock substitution",
    async () => {
      assert.ok(prisma);
      await prisma.vulnerability.deleteMany();
      const overview = await api("overview", true);
      assert.equal(overview.dataSource.kind, "database");
      assert.equal(overview.dataSource.reason, "live_read_model");
      assert.equal(overview.cards.length, 4);
      assert.ok(
        overview.cards.every((card: { value: number }) => card.value === 0),
      );
      const kev = await api("kev", true);
      assert.equal(kev.dataSource.kind, "database");
      assert.deepEqual(kev.items, []);
      const current = await page();
      try {
        await current.goto(`${frontendOrigin}/overview`);
        await expect(
          current.getByText("표시할 KEV 항목이 없습니다.", { exact: true }),
        ).toBeVisible();
        await expect(current.getByRole("table").getByRole("link")).toHaveCount(
          0,
        );
      } finally {
        await current.close();
      }
    },
  );
  await check(
    "actual Nest no-database fallback remains explicit and renders unknown reliability",
    async () => {
      await stop(backend);
      await startBackend(false);
      const feed = await api("feed", true);
      assert.equal(feed.dataSource.kind, "mock");
      assert.equal(feed.dataSource.reason, "database_unavailable");
      assert.ok(
        feed.items.every(
          (item: { reliability: { level: string } }) =>
            item.reliability.level === "unknown",
        ),
      );
      const current = await page();
      try {
        await current.goto(`${frontendOrigin}/feed`);
        await expect(current.getByText("MOCK", { exact: true })).toBeVisible();
        await expect(
          current.getByText(feed.items[0].cveId, { exact: true }),
        ).toBeVisible();
      } finally {
        await current.close();
      }
    },
  );
  await check("browser requests never carry the server API token", async () => {
    assert.equal(browserCredentialLeaks, 0);
  });
  await check(
    "all browser flows complete without uncaught page errors",
    async () => {
      assert.deepEqual(browserErrors, []);
    },
  );
}

const baseSha = command("git", ["rev-parse", "HEAD"]);
const workingTreeDirty = command("git", ["status", "--porcelain"]) !== "";

const interrupt = () => {
  interrupted = true;
  void browser?.close().catch(() => {});
};
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);
try {
  await main();
} catch (error) {
  fatal = redact(error instanceof Error ? error.message : String(error));
  console.error(`[FAIL] ${fatal}`);
  console.error(logs.slice(-8).join("").slice(-4_000));
  process.exitCode = 1;
} finally {
  const outcome = await finishVerification({
    fatal,
    redact,
    actions: {
      browserClosed: () => browser?.close(),
      backendStopped: () => stop(backend),
      frontendStopped: () => stop(frontend),
      databaseDisconnected: () => prisma?.$disconnect(),
      databaseRemoved: () => {
        if (!dockerCreated) return;
        assert.equal(
          command("docker", [
            "inspect",
            "--format",
            '{{index .Config.Labels "heap-forge.verification"}}',
            container,
          ]),
          runId,
        );
        command("docker", ["rm", "--force", "--volumes", container]);
      },
      temporaryFilesRemoved: async () => {
        if (temp) await rm(temp, { recursive: true, force: true });
      },
    },
    report: async (cleanupResult) => {
      const runnerSha256 = createHash("sha256")
        .update(await readFile(fileURLToPath(import.meta.url)))
        .digest("hex");
      const cleanupRunnerSha256 = createHash("sha256")
        .update(
          await readFile(
            new URL("./verification-cleanup.mts", import.meta.url),
          ),
        )
        .digest("hex");
      const report = {
        startedAt,
        finishedAt: new Date().toISOString(),
        baseSha,
        workingTreeDirty,
        runnerSha256,
        cleanupRunnerSha256,
        node: process.version,
        databaseImage: image,
        browser: browserVersion,
        endpoints: { backend: backendOrigin, frontend: frontendOrigin },
        scope:
          "isolated PostgreSQL fixtures + compiled Nest + production Vite preview + local deployment proxy handler invocation; no upstream ingestion or deployment",
        results,
        fixtureSummary,
        screenshots,
        ...cleanupResult,
      };
      const json = await format(JSON.stringify(report), {
        ...(await resolveConfig(artifacts)),
        filepath: artifacts,
      });
      assert.ok(
        !privateValues.some((secret) => json.includes(secret)),
        "Do not persist verification credentials",
      );
      await mkdir(join(root, "docs/verification/artifacts"), {
        recursive: true,
      });
      await writeFile(artifacts, json, { flag: "wx" });
      console.log(`Evidence: ${artifacts}`);
    },
  });
  for (const error of outcome.cleanupErrors)
    console.error(`[CLEANUP FAIL] ${error.step}: ${error.message}`);
  if (outcome.reportError !== undefined)
    console.error(`[REPORT FAIL] ${outcome.reportError}`);
  if (outcome.failed) process.exitCode = 1;
}

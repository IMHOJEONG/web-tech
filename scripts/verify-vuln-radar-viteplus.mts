import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
const app = join(root, "apps/vuln-radar");
const require = createRequire(join(app, "package.json"));
const backendRequire = createRequire(
  join(root, "apps/docs-backend/package.json"),
);
const vp = join(
  dirname(require.resolve("vite-plus/package.json")),
  "dist/bin.js",
);
const token = randomBytes(32).toString("hex");
const redact = (text: string) => text.split(token).join("[redacted]");
const mode = "viteplus-verification";
const children: ChildProcess[] = [];
const logs: string[] = [];
const results: Array<{ name: string; durationMs: number }> = [];
const requests: Array<{ path: string; authorized: boolean }> = [];
const peerContextChanges: string[] = [];
const temp = await mkdtemp(join(tmpdir(), "vuln-viteplus-"));
const outDir = join(temp, "dist");
const artifact = join(
  root,
  `docs/verification/artifacts/${new Date().toISOString().replace(/[:.]/g, "-")}-vuln-radar-viteplus.json`,
);
const backend = createServer((request, response) => {
  const authorized = request.headers.authorization === `Bearer ${token}`;
  requests.push({ path: request.url ?? "", authorized });
  response.writeHead(authorized ? 200 : 401, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify({ fixture: authorized, path: request.url }));
});
let interrupted = false;
let failure: string | undefined;
const cleanupErrors: string[] = [];
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    interrupted = true;
    for (const child of children) terminate(child);
  });
}

function terminate(child: ChildProcess) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null)
    return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
  }
}

async function check(name: string, action: () => Promise<void>) {
  assert.ok(!interrupted, "Verification interrupted");
  const start = performance.now();
  await action();
  results.push({ name, durationMs: Math.round(performance.now() - start) });
  console.log(`[PASS] ${name}`);
}

async function listen(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return address.port;
}

async function close(server: Server) {
  if (!server.listening) return;
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

async function start(command: "dev" | "preview", env: NodeJS.ProcessEnv) {
  const reservation = createServer();
  const port = await listen(reservation);
  await close(reservation);
  const args = [
    vp,
    command,
    "--mode",
    mode,
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ];
  if (command === "preview") args.push("--outDir", outDir);
  const child = spawn(process.execPath, args, {
    cwd: app,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  child.on("error", (error) => logs.push(redact(error.message)));
  for (const stream of [child.stdout, child.stderr])
    stream?.on("data", (chunk: Buffer) => {
      logs.push(redact(chunk.toString()));
      if (logs.length > 60) logs.shift();
    });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.ok(
      !interrupted && child.exitCode === null && child.signalCode === null,
      "Owned Vite+ server exited",
    );
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return origin;
    } catch {
      /* Only wait for the server started by this run. */
    }
    await delay(100);
  }
  throw new Error(`Vite+ ${command} did not become ready`);
}

try {
  await check("existing tooling and test scripts are unchanged", async () => {
    for (const file of [".mise.toml", "turbo.json", "package.json"]) {
      const baseline = spawnSync("git", ["show", `HEAD:${file}`], {
        cwd: root,
        encoding: "utf8",
      });
      assert.equal(baseline.status, 0);
      assert.equal(
        await readFile(join(root, file), "utf8"),
        baseline.stdout,
        file,
      );
    }
    const manifest = require("./package.json");
    const previous = JSON.parse(
      spawnSync("git", ["show", "HEAD:apps/vuln-radar/package.json"], {
        cwd: root,
        encoding: "utf8",
      }).stdout,
    );
    for (const script of [
      "predev",
      "prebuild",
      "test:lib",
      "lint",
      "typecheck",
    ])
      assert.equal(manifest.scripts[script], previous.scripts[script], script);
    for (const file of [
      ".env",
      ".env.local",
      `.env.${mode}`,
      `.env.${mode}.local`,
    ])
      assert.ok(
        !existsSync(join(app, file)),
        "Refusing to load an existing env file; use a clean experiment checkout",
      );
  });
  await check(
    "dependency policy changes stay bounded and retain compatible consumers",
    async () => {
      const result = spawnSync(
        process.execPath,
        [
          "--experimental-strip-types",
          "--test",
          "scripts/viteplus-dependency-policy.test.mts",
        ],
        { cwd: root, encoding: "utf8", timeout: 30_000 },
      );
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    },
  );
  await check(
    "app, React plugin and Vite+ use one matching Vite core",
    async () => {
      const plugin = createRequire(require.resolve("@vitejs/plugin-react"));
      const toolchain = createRequire(require.resolve("vite-plus"));
      assert.equal(require("vite-plus/package.json").version, "1.4.0");
      assert.equal(
        require("vite/package.json").name,
        "@voidzero-dev/vite-plus-core",
      );
      assert.equal(require("vite/package.json").version, "1.4.0");
      assert.equal(plugin.resolve("vite"), require.resolve("vite"));
      assert.equal(toolchain.resolve("vite"), require.resolve("vite"));
    },
  );
  await check(
    "other workspace direct dependencies change only the reviewed PostCSS resolution",
    async () => {
      const { parseAllDocuments } = backendRequire("yaml") as {
        parseAllDocuments: (text: string) => Array<{ toJSON: () => unknown }>;
      };
      type Lock = {
        importers: Record<
          string,
          Record<string, Record<string, { specifier: string; version: string }>>
        >;
      };
      const parse = (text: string) =>
        parseAllDocuments(text).at(-1)!.toJSON() as Lock;
      const baseline = spawnSync("git", ["show", "HEAD:pnpm-lock.yaml"], {
        cwd: root,
        encoding: "utf8",
      });
      assert.equal(baseline.status, 0);
      const before = parse(baseline.stdout);
      const after = parse(await readFile(join(root, "pnpm-lock.yaml"), "utf8"));
      for (const [workspace, importer] of Object.entries(before.importers)) {
        if (workspace === "apps/vuln-radar") continue;
        const next = after.importers[workspace];
        assert.ok(next, workspace);
        for (const [scope, dependencies] of Object.entries(importer)) {
          assert.deepEqual(
            Object.keys(next[scope] ?? {}).sort(),
            Object.keys(dependencies).sort(),
          );
          for (const [name, previous] of Object.entries(dependencies)) {
            const current: { specifier: string; version: string } | undefined =
              next[scope]?.[name];
            assert.ok(current);
            if (name === "postcss") {
              const source = JSON.parse(
                await readFile(join(root, workspace, "package.json"), "utf8"),
              );
              assert.equal(
                current.specifier,
                source[scope][name],
                `${workspace}: restore the original manifest instead of the removed override`,
              );
              const [major, minor, patch] = current.version
                .split("(")[0]!
                .split(".")
                .map(Number);
              assert.ok(
                major === 8 && minor === 5 && patch! >= 23,
                `${workspace}: PostCSS patch must retain the security floor`,
              );
            } else {
              assert.equal(
                current.specifier,
                previous.specifier,
                `${workspace}:${name}`,
              );
              assert.equal(
                current.version.split("(")[0],
                previous.version.split("(")[0],
                `${workspace}:${name}`,
              );
            }
          }
        }
        if (JSON.stringify(importer) !== JSON.stringify(next))
          peerContextChanges.push(workspace);
      }
    },
  );
  const backendPort = await listen(backend);
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: temp,
    TMPDIR: temp,
    CI: "1",
    VULN_RADAR_BACKEND_ORIGIN: `http://127.0.0.1:${backendPort}`,
    VULN_RADAR_BACKEND_API_TOKEN: token,
    VITE_APP_TITLE: "Global Vuln Radar",
    VITE_API_BASE_PATH: "/api/backend",
  };
  let dev = "";
  await check(
    "vp dev starts on loopback and transforms React entry",
    async () => {
      dev = await start("dev", env);
      const html = await (await fetch(`${dev}/overview`)).text();
      assert.match(html, /@vite\/client/);
      const entry = await fetch(`${dev}/src/app/main.tsx`);
      assert.equal(entry.status, 200);
      assert.match(await entry.text(), /createRoot/);
    },
  );
  await check(
    "dev proxy rewrites path and replaces browser authorization",
    async () => {
      const response = await fetch(`${dev}/api/backend/health?fixture=dev`, {
        headers: { Authorization: "Bearer forged-browser-value" },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        fixture: true,
        path: "/api/health?fixture=dev",
      });
      assert.deepEqual(requests.at(-1), {
        path: "/api/health?fixture=dev",
        authorized: true,
      });
      assert.ok(
        !(
          await (await fetch(`${dev}/src/shared/config/env.shared.ts`)).text()
        ).includes(token),
      );
    },
  );
  await check(
    "vp build succeeds without exposing the server token",
    async () => {
      const result = spawnSync(
        process.execPath,
        [vp, "build", "--mode", mode, "--outDir", outDir],
        { cwd: app, env, encoding: "utf8", timeout: 120_000 },
      );
      assert.equal(
        result.status,
        0,
        redact(result.error?.message ?? `${result.stdout}\n${result.stderr}`),
      );
      for (const file of await readdir(join(outDir, "assets"))) {
        const content = await readFile(join(outDir, "assets", file), "utf8");
        assert.ok(
          !content.includes(token),
          "Private token leaked to build assets",
        );
      }
      assert.ok(
        (await readFile(join(outDir, "index.html"), "utf8")).includes(
          "/assets/",
        ),
      );
    },
  );
  await check(
    "vp preview preserves SPA fallback, assets and private proxy",
    async () => {
      const preview = await start("preview", env);
      const html = await (await fetch(`${preview}/overview`)).text();
      const asset = html.match(/src="([^"]+\.js)"/)?.[1];
      assert.ok(asset);
      assert.equal((await fetch(new URL(asset, preview))).status, 200);
      const response = await fetch(
        `${preview}/api/backend/health?fixture=preview`,
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        fixture: true,
        path: "/api/health?fixture=preview",
      });
      assert.ok(requests.every((request) => request.authorized));
      assert.equal(
        (await fetch(`${preview}/vulnerabilities/CVE-2026-0001`)).status,
        200,
      );
    },
  );
} catch (error) {
  failure = redact(error instanceof Error ? error.message : String(error));
  console.error(failure);
} finally {
  for (const child of children) {
    try {
      terminate(child);
      for (
        let attempt = 0;
        attempt < 30 && child.exitCode === null && child.signalCode === null;
        attempt++
      )
        await delay(100);
      if (child.exitCode === null && child.signalCode === null && child.pid) {
        process.kill(-child.pid, "SIGKILL");
        await delay(100);
      }
      assert.ok(
        child.exitCode !== null || child.signalCode !== null,
        "Owned process still running",
      );
    } catch (error) {
      cleanupErrors.push(redact(String(error)));
    }
  }
  try {
    await close(backend);
  } catch (error) {
    cleanupErrors.push(redact(String(error)));
  }
  try {
    await rm(temp, { recursive: true, force: true });
  } catch (error) {
    cleanupErrors.push(redact(String(error)));
  }
  await writeFile(
    artifact,
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        baseSha: spawnSync("git", ["rev-parse", "HEAD"], {
          cwd: root,
          encoding: "utf8",
        }).stdout.trim(),
        runnerSha256: createHash("sha256")
          .update(await readFile(fileURLToPath(import.meta.url)))
          .digest("hex"),
        node: process.version,
        vitePlus: "1.4.0",
        results,
        peerContextChanges,
        cleanupErrors,
        ...(failure ? { failure, logs } : {}),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Evidence: ${artifact}`);
  if (failure || interrupted || cleanupErrors.length) process.exitCode = 1;
}

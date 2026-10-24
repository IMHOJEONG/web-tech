import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  copyBaselineManifests,
  resolveVerificationBaseline,
} from "./verification-baseline.mts";

const script = fileURLToPath(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
const fixture =
  "const node = <><p>hello</p><style jsx>{`p { color: red; }`}</style></>";

function probe(directory: string) {
  const docs = createRequire(join(directory, "apps/docs/package.json"));
  const next = createRequire(docs.resolve("next"));
  const styled = createRequire(next.resolve("styled-jsx"));
  const plugin = next.resolve("styled-jsx/babel");
  function transform(babel: {
    version: string;
    transformSync: (source: string, options: unknown) => { code: string };
  }) {
    try {
      const output = babel.transformSync(fixture, {
        configFile: false,
        babelrc: false,
        plugins: [plugin],
        parserOpts: { plugins: ["jsx"] },
      });
      return {
        version: babel.version,
        succeeded: output.code.includes("jsx-"),
      };
    } catch (error) {
      const failure = error as Error & { code?: string; range?: string };
      return {
        version: babel.version,
        succeeded: false,
        code: failure.code,
        requiredRange: failure.range,
      };
    }
  }
  let optionalBabel;
  try {
    optionalBabel = transform(styled("@babel/core"));
  } catch (error) {
    optionalBabel = {
      available: false,
      code: (error as NodeJS.ErrnoException).code,
    };
  }
  const bundledBabel = transform(next("next/dist/compiled/babel/core"));
  const configFile = next(
    "next/dist/build/get-babel-config-file",
  ).getBabelConfigFile(join(directory, "apps/docs"));
  return {
    optionalBabel,
    bundledBabel,
    customBabelConfig: Boolean(configFile),
  };
}

async function main() {
  const baseline = resolveVerificationBaseline(root, process.argv.slice(2));
  const temp = await mkdtemp(join(tmpdir(), "viteplus-baseline-peers-"));
  const currentLock = await readFile(join(root, "pnpm-lock.yaml"));
  const sha256 = (content: Uint8Array) =>
    createHash("sha256").update(content).digest("hex");
  const hash = sha256(currentLock);
  const report: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    baseSha: baseline.sha,
    baselineRef: baseline.ref,
    currentLockSha256: hash,
  };
  let failed = false;
  try {
    await copyBaselineManifests(baseline, temp);
    const store = execFileSync("pnpm", ["store", "path"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    const install = spawnSync(
      "pnpm",
      [
        "install",
        "--offline",
        "--frozen-lockfile",
        "--ignore-scripts",
        "--store-dir",
        store,
      ],
      { cwd: temp, encoding: "utf8", timeout: 120_000 },
    );
    report.baselineInstall = {
      status: install.status,
      offline: true,
      frozenLockfile: true,
      ignoreScripts: true,
    };
    assert.equal(
      install.status,
      0,
      install.error?.message ?? "Offline baseline install failed",
    );
    assert.equal(
      sha256(await readFile(join(temp, "pnpm-lock.yaml"))),
      sha256(baseline.readFile("pnpm-lock.yaml")),
      "Baseline lockfile changed",
    );
    for (const [label, directory] of [
      ["baseline", temp],
      ["experiment", root],
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--experimental-strip-types", script, "--probe", directory!],
        { cwd: directory, encoding: "utf8", timeout: 30_000 },
      );
      assert.equal(
        result.status,
        0,
        result.error?.message ?? "Consumer probe failed",
      );
      report[label!] = JSON.parse(result.stdout);
    }
    report.fixturesOnly = true;
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error);
    failed = true;
  } finally {
    try {
      await rm(temp, { recursive: true, force: true });
      report.temporaryBaselineRemoved = true;
    } catch {
      report.temporaryBaselineRemoved = false;
      failed = true;
    }
    report.experimentLockUnchanged =
      hash === sha256(await readFile(join(root, "pnpm-lock.yaml")));
    if (!report.experimentLockUnchanged) failed = true;
    const artifact = join(
      root,
      `docs/verification/artifacts/${new Date().toISOString().replace(/[:.]/g, "-")}-viteplus-consumer-control.json`,
    );
    await writeFile(artifact, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
    console.log(`Evidence: ${artifact}`);
    if (failed) process.exitCode = 1;
  }
}

if (process.argv[2] === "--probe") {
  assert.ok(process.argv[3]);
  console.log(JSON.stringify(probe(process.argv[3])));
} else await main();

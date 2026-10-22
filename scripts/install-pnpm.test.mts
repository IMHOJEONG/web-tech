import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { installPnpm } from "./install-pnpm.mts";

const root = fileURLToPath(new URL("..", import.meta.url));
const version = "12.14.0";

function fixture(t: { after(fn: () => void): void }) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "pnpm-bootstrap-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bootstrap = path.join(directory, "bootstrap");
  const bin = path.join(directory, "bin");
  const native = path.join(
    bootstrap,
    "node_modules",
    `@pnpm/exe.${process.platform}-${process.arch}`,
  );
  const packageDirectory = path.join(bootstrap, "node_modules", "pnpm");
  mkdirSync(native, { recursive: true });
  mkdirSync(packageDirectory, { recursive: true });
  writeFileSync(
    path.join(directory, "package.json"),
    JSON.stringify({ packageManager: `pnpm@${version}` }),
  );
  writeFileSync(
    path.join(bootstrap, "package.json"),
    JSON.stringify({ dependencies: { pnpm: version } }),
  );
  writeFileSync(path.join(native, "package.json"), JSON.stringify({ version }));
  writeFileSync(path.join(native, "pnpm"), "fixture");
  const executable = path.join(packageDirectory, "pnpm");
  writeFileSync(executable, `#!/bin/sh\nprintf '${version}\\n'\n`);
  chmodSync(executable, 0o755);
  return { directory, bootstrap, bin, native, executable };
}

test("Docker bootstrap matches the root pin and locks signed host binary candidates", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const bootstrap = JSON.parse(
    readFileSync(
      path.join(root, "scripts/pnpm-bootstrap/package.json"),
      "utf8",
    ),
  );
  const lock = JSON.parse(
    readFileSync(
      path.join(root, "scripts/pnpm-bootstrap/package-lock.json"),
      "utf8",
    ),
  );
  assert.equal(manifest.packageManager, `pnpm@${version}`);
  assert.equal(bootstrap.dependencies.pnpm, version);
  const tools = readFileSync(path.join(root, ".mise.toml"), "utf8");
  assert.ok(
    tools.indexOf("pnpm =") < tools.indexOf("node ="),
    "native pnpm must precede Node's Corepack shim on PATH",
  );
  assert.match(
    readFileSync(path.join(root, ".mise.toml"), "utf8"),
    new RegExp(`pnpm = "${version.replaceAll(".", "\\.")}"`),
  );
  for (const name of ["pnpm", "@pnpm/exe.linux-x64", "@pnpm/exe.linux-arm64"]) {
    const pkg = lock.packages[`node_modules/${name}`];
    assert.equal(pkg.version, version);
    assert.match(pkg.integrity, /^sha512-/);
    assert.match(pkg.resolved, /^https:\/\/registry\.npmjs\.org\//);
  }
});

test("no pnpm lifecycle or executable runs before npm signature verification", (t) => {
  const f = fixture(t);
  const calls: { file: string; args: string[] }[] = [];
  installPnpm(f.directory, f.bootstrap, f.bin, (file, args) =>
    calls.push({ file, args }),
  );
  assert.deepEqual(
    calls.map((c) => c.args),
    [
      [
        "ci",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        "--registry=https://registry.npmjs.org",
      ],
      ["audit", "signatures", "--registry=https://registry.npmjs.org"],
      [path.join(f.bootstrap, "node_modules/pnpm/install.js")],
    ],
  );
  assert.ok(existsSync(path.join(f.bin, "pnpm")));
});

for (const failure of [
  "EINTEGRITY",
  "invalid registry signature",
  "terminated",
]) {
  test(`${failure} fails closed without executing pnpm or falling back`, (t) => {
    const f = fixture(t);
    const calls: string[][] = [];
    assert.throws(
      () =>
        installPnpm(f.directory, f.bootstrap, f.bin, (_file, args) => {
          calls.push(args);
          if (failure === "EINTEGRITY" || args[0] === "audit")
            throw new Error(failure);
        }),
      new RegExp(failure),
    );
    assert.equal(calls.length, failure === "EINTEGRITY" ? 1 : 2);
    assert.equal(existsSync(path.join(f.bin, "pnpm")), false);
  });
}

test("version disagreement is rejected before any install", (t) => {
  const f = fixture(t);
  writeFileSync(
    path.join(f.bootstrap, "package.json"),
    JSON.stringify({ dependencies: { pnpm: "11.10.0" } }),
  );
  assert.throws(
    () =>
      installPnpm(f.directory, f.bootstrap, f.bin, () =>
        assert.fail("must not run"),
      ),
    /must match/,
  );
});

test("a missing signed platform binary cannot trigger the installer's download fallback", (t) => {
  const f = fixture(t);
  rmSync(path.join(f.native, "pnpm"));
  const calls: string[][] = [];
  assert.throws(
    () =>
      installPnpm(f.directory, f.bootstrap, f.bin, (_file, args) => {
        calls.push(args);
      }),
    /missing/,
  );
  assert.equal(calls.length, 2);
  assert.equal(existsSync(path.join(f.bin, "pnpm")), false);
});

test("every CI setup uses the pnpm-12-capable action without a second version or bypass", () => {
  for (const file of [
    ".github/workflows/ci.yml",
    ".github/workflows/documentation.yml",
  ]) {
    const workflow = readFileSync(path.join(root, file), "utf8");
    assert.ok(
      workflow.includes(
        "pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413",
      ),
    );
    assert.doesNotMatch(
      workflow,
      /pnpm\/action-setup@0ebf471|pmOnFail|COREPACK_INTEGRITY_KEYS|continue-on-error/,
    );
    for (const step of workflow
      .split(/\n\s+- /)
      .filter((s) => s.includes("uses: pnpm/action-setup@"))) {
      assert.doesNotMatch(step, /\bversion:/);
    }
  }
});

test("both Docker builds retain signature verification and bootstrap changes trigger image CI", () => {
  for (const app of ["docs-backend", "vuln-radar-backend"]) {
    const dockerfile = readFileSync(
      path.join(root, `apps/${app}/Dockerfile`),
      "utf8",
    );
    assert.match(
      dockerfile,
      /COPY scripts\/pnpm-bootstrap \/opt\/pnpm-bootstrap/,
    );
    assert.match(
      dockerfile,
      /node --experimental-strip-types \/opt\/install-pnpm\.mts \/repo \/opt\/pnpm-bootstrap \/pnpm/,
    );
    assert.doesNotMatch(dockerfile, /corepack|pmOnFail|INTEGRITY_KEYS/);
    assert.match(dockerfile, /pnpm install[^\n]*--frozen-lockfile/);
  }
  const workflow = readFileSync(
    path.join(root, ".github/workflows/docs-backend-image.yml"),
    "utf8",
  );
  assert.equal(
    [...workflow.matchAll(/"scripts\/install-pnpm\.mts"/g)].length,
    2,
  );
  assert.equal(
    [...workflow.matchAll(/"scripts\/pnpm-bootstrap\/\*\*"/g)].length,
    2,
  );
});

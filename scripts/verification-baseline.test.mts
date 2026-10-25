import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test, { type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { compareGraphs, type Lock } from "./analyze-vuln-radar-lockfile.mts";
import {
  assertBaselineAppScriptsUnchanged,
  assertBaselineFilesUnchanged,
  copyBaselineManifests,
  resolveVerificationBaseline,
  verificationGitEnvironment,
} from "./verification-baseline.mts";

const root = fileURLToPath(new URL("../", import.meta.url));

function fixture(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "verification-baseline-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const env = verificationGitEnvironment();
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: directory, encoding: "utf8", env }).trim();
  const write = (file: string, text: string) => {
    mkdirSync(dirname(join(directory, file)), { recursive: true });
    writeFileSync(join(directory, file), text);
  };
  const commit = (message: string) => {
    git("add", ".");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      message,
    );
    return git("rev-parse", "HEAD");
  };
  const lock = (version: string): Lock => ({
    importers: {
      "apps/app": { dependencies: { a: { specifier: version, version } } },
    },
    snapshots: { [`a@${version}`]: {} },
  });
  git("init", "-q", "-b", "main");
  write("package.json", '{"private":true,"scripts":{"test":"baseline"}}');
  write("apps/app/package.json", '{"scripts":{"test:lib":"baseline"}}');
  write("packages/removed/package.json", '{"name":"removed"}');
  write("pnpm-lock.yaml", JSON.stringify(lock("1")));
  write("pnpm-workspace.yaml", "packages: [apps/*, packages/*]\n");
  const baseSha = commit("baseline");
  git("branch", "fixture-base", baseSha);
  git("checkout", "-qb", "experiment");
  write("package.json", '{"private":true,"scripts":{"test":"experiment"}}');
  write("apps/app/package.json", '{"scripts":{"test:lib":"experiment"}}');
  write("packages/new/package.json", '{"name":"new"}');
  rmSync(join(directory, "packages/removed"), { recursive: true });
  write("pnpm-lock.yaml", JSON.stringify(lock("2")));
  const headSha = commit("committed experiment");
  return { directory, git, write, commit, baseSha, headSha };
}

test("an explicit baseline is required; malformed or missing refs never fall back", (t) => {
  const f = fixture(t);
  for (const args of [
    [],
    ["--base"],
    ["HEAD"],
    ["--base", "--help"],
    ["--base", "main", "extra"],
    ["--base", ""],
    ["--base", "main\nHEAD"],
  ])
    assert.throws(
      () => resolveVerificationBaseline(f.directory, args),
      /Usage/,
    );
  for (const ref of ["missing-ref", "HEAD:pnpm-lock.yaml"])
    assert.throws(() =>
      resolveVerificationBaseline(f.directory, ["--base", ref]),
    );
  assert.throws(
    () => resolveVerificationBaseline(f.directory, ["--base", "HEAD^{tree}"]),
    /existing commit/,
  );
});

test("the ref is resolved once and survives later commits and a moved branch", (t) => {
  const f = fixture(t);
  const baseline = resolveVerificationBaseline(f.directory, [
    "--base",
    "fixture-base",
  ]);
  f.git("branch", "-f", "fixture-base", f.headSha);
  f.write("third.txt", "later commit");
  f.commit("later");
  assert.equal(baseline.sha, f.baseSha);
  assert.equal(
    baseline.readFile("package.json").toString(),
    f.git("show", `${f.baseSha}:package.json`),
  );
  assert.ok(baseline.files().includes("packages/removed/package.json"));
  assert.ok(!baseline.files().includes("packages/new/package.json"));
});

test("tooling changes already committed to HEAD are still rejected", (t) => {
  const f = fixture(t);
  const baseline = resolveVerificationBaseline(f.directory, [
    "--base",
    f.baseSha,
  ]);
  assert.throws(
    () => assertBaselineFilesUnchanged(baseline, f.directory, ["package.json"]),
    /differs from baseline/,
  );
  assertBaselineFilesUnchanged(
    resolveVerificationBaseline(f.directory, ["--base", "HEAD"]),
    f.directory,
    ["package.json"],
  );
});

test("app test script changes already committed to HEAD are still rejected", (t) => {
  const f = fixture(t);
  const baseline = resolveVerificationBaseline(f.directory, [
    "--base",
    f.baseSha,
  ]);
  assert.throws(
    () =>
      assertBaselineAppScriptsUnchanged(
        baseline,
        f.directory,
        "apps/app/package.json",
        ["test:lib"],
      ),
    /test:lib: differs from baseline/,
  );
});

test("the baseline tree and lockfile copy stay distinct from the committed experiment", async (t) => {
  const f = fixture(t);
  const baseline = resolveVerificationBaseline(f.directory, [
    "--base",
    f.baseSha,
  ]);
  const destination = join(f.directory, "control-copy");
  const files = await copyBaselineManifests(baseline, destination);
  assert.ok(files.includes("packages/removed/package.json"));
  assert.ok(!files.includes("packages/new/package.json"));
  for (const file of files)
    assert.deepEqual(
      readFileSync(join(destination, file)),
      baseline.readFile(file),
    );
  const before = JSON.parse(
    readFileSync(join(destination, "pnpm-lock.yaml"), "utf8"),
  );
  const after = JSON.parse(
    readFileSync(join(f.directory, "pnpm-lock.yaml"), "utf8"),
  );
  const result = compareGraphs(before, after, "apps/app", true);
  assert.deepEqual(result.added, ["a@2"]);
  assert.deepEqual(result.removed, ["a@1"]);
  assert.deepEqual(compareGraphs(after, after, "apps/app", true).added, []);
  assert.equal(baseline.sha, f.baseSha);
});

test("a missing baseline file fails instead of reading the current tree", (t) => {
  const f = fixture(t);
  const baseline = resolveVerificationBaseline(f.directory, [
    "--base",
    f.baseSha,
  ]);
  assert.throws(() => baseline.readFile("packages/new/package.json"));
});

test("Git subprocesses discard inherited repository, index and config selectors", () => {
  assert.deepEqual(
    verificationGitEnvironment({
      PATH: "fixture-path",
      HOME: "fixture-home",
      GIT_DIR: "caller-repository",
      GIT_WORK_TREE: "caller-tree",
      GIT_INDEX_FILE: "caller-index",
      GIT_COMMON_DIR: "caller-common-dir",
      GIT_CONFIG_PARAMETERS: "caller-parameters",
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "core.worktree",
      GIT_CONFIG_VALUE_0: "caller-tree",
      git_object_directory: "caller-objects",
    }),
    { PATH: "fixture-path", HOME: "fixture-home" },
  );
});

test("a contaminated caller cannot redirect fixture commits or baseline reads", (t) => {
  const caller = fixture(t);
  caller.write("caller-only.txt", "keep this distinct from child fixtures");
  caller.commit("distinct caller repository");
  caller.git("branch", "-f", "fixture-base", "HEAD");
  const index = join(caller.directory, ".git/index");
  const before = {
    head: caller.git("rev-parse", "HEAD"),
    status: caller.git("status", "--porcelain"),
    index: readFileSync(index),
  };
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "--test-name-pattern=^the ref is resolved once and survives later commits and a moved branch$",
      fileURLToPath(import.meta.url),
    ],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 15_000,
      env: {
        ...process.env,
        GIT_DIR: join(caller.directory, ".git"),
        GIT_WORK_TREE: caller.directory,
        GIT_INDEX_FILE: index,
        GIT_COMMON_DIR: join(caller.directory, ".git"),
      },
    },
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(caller.git("rev-parse", "HEAD"), before.head);
  assert.equal(caller.git("status", "--porcelain"), before.status);
  assert.deepEqual(readFileSync(index), before.index);
});

for (const script of [
  "verify-vuln-radar-viteplus.mts",
  "analyze-vuln-radar-lockfile.mts",
  "verify-viteplus-consumer-impact.mts",
]) {
  test(`${script} rejects a missing baseline before creating artifacts`, () => {
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", join(root, "scripts", script)],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 10_000,
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /explicit baseline required/);
    assert.doesNotMatch(result.stdout, /Evidence:|\[PASS\]/);
    const source = readFileSync(join(root, "scripts", script), "utf8");
    assert.match(
      source,
      /resolveVerificationBaseline\(root, process\.argv\.slice\(2\)\)/,
    );
    assert.doesNotMatch(source, /HEAD:|\["ls-files"/);
  });
}

import assert from "node:assert/strict";
import test from "node:test";
import type { TestContext } from "node:test";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  checkStaged,
  checkRange,
  checkPush,
  digest,
  inspect,
  readReviews,
  REVIEW_FILE,
} from "./check-publication.mts";

const code = Buffer.from("export const sample = true;\n");
const article = "apps/docs/category/web/sample.mdx";
const published = Buffer.from(
  "---\nstatus: published\n---\n## Public example\n",
);
function approval(path: string, bytes: Buffer, kind = "article") {
  return {
    path,
    sha256: digest(bytes),
    kind,
    decision: "public-approved",
    reviewedOn: "2026-10-30",
    note: "Synthetic test approval, not a real publication approval.",
    checks: {
      secrets: true,
      personalData: true,
      rights: true,
      publicIntent: true,
    },
  };
}
const reviews = (...entries: ReturnType<typeof approval>[]) =>
  readReviews(Buffer.from(JSON.stringify({ version: 1, entries })));
const rules = (
  path: string,
  bytes = code,
  mode = "100644",
  approved = reviews(),
) => inspect(path, bytes, mode, approved).map((issue) => issue.rule);

test("requires exact reviewed bytes for published articles and each asset", () => {
  assert.deepEqual(rules(article, published), ["public-review-required"]);
  const approved = reviews(approval(article, published));
  assert.deepEqual(rules(article, published, "100644", approved), []);
  assert(
    rules(
      article,
      Buffer.concat([published, code]),
      "100644",
      approved,
    ).includes("public-review-required"),
  );
  assert(
    rules("apps/docs/public/image.png", Buffer.from([0, 1])).includes(
      "public-review-required",
    ),
  );
});
test("draft is not a private Git store, even with an approval entry", () => {
  const draft = Buffer.from("---\nstatus: draft\n---\nunfinished\n");
  assert(
    rules(article, draft, "100644", reviews(approval(article, draft))).includes(
      "nonpublished-article",
    ),
  );
  assert(
    rules(
      "docs/note.md",
      Buffer.from("---\nvisibility: private\n---\n"),
    ).includes("private-visibility"),
  );
});
test("raw data, captures, env values and keys cannot be approved", () => {
  for (const path of [
    ".private/note.md",
    "secrets/token",
    "capture.har",
    "data.pcapng",
    "private/raw.json",
    "test-results/result.json",
    ".env.production",
    "x/.env.local",
    "key.pem",
    "trace.zip",
  ]) {
    assert(rules(path).includes("private-material"), path);
  }
  assert.deepEqual(rules(".env.example", Buffer.from("TOKEN=${TOKEN}\n")), []);
});
test("test code stays public-capable, data needs a classification", () => {
  assert.deepEqual(rules("apps/docs/e2e/sample.test.ts"), []);
  assert(
    rules("apps/docs/e2e/fixtures/result.json").includes(
      "public-review-required",
    ),
  );
  const path = "docs/verification/artifacts/result.json";
  assert.deepEqual(
    rules(
      path,
      code,
      "100644",
      reviews(approval(path, code, "sanitized-evidence")),
    ),
    [],
  );
  assert(
    rules(
      path,
      code,
      "100644",
      reviews(approval(path, code, "asset")),
    ).includes("public-review-required"),
  );
});
test("operational Markdown cannot silently publish raw observations", () => {
  for (const path of [
    "docs/worklog/2026-10/record.md",
    "docs/verification/report.md",
    "docs/architecture/policy.md",
    "docs/process/README.md",
  ]) {
    assert(rules(path).includes("public-review-required"));
    assert.deepEqual(
      rules(path, code, "100644", reviews(approval(path, code, "document"))),
      [],
    );
  }
});
test("credentials are blocked without echoing a value or private filename", () => {
  const values = [
    "gh" + "p_" + "A".repeat(36),
    "Bearer " + "b".repeat(40),
    "-----BEGIN " + "PRIVATE KEY-----",
    "postgres" + "://admin:password@host/db",
    'API_TOKEN="' + "q".repeat(32) + '"',
  ];
  for (const value of values) {
    const path = "personal-hidden-name.txt";
    const result = inspect(path, Buffer.from(value), "100644", reviews());
    assert(result.some((issue) => issue.rule === "credential-pattern"));
    const output = JSON.stringify(result);
    assert(!output.includes(value));
    assert(!output.includes(path));
    assert.equal(result[0]!.fileId, digest(path));
  }
});
test("credentials embedded in filenames are blocked without displaying the name", () => {
  const path = "gh" + "p_" + "N".repeat(36) + ".txt";
  const result = inspect(path, code, "100644", reviews());
  assert(result.some((issue) => issue.rule === "credential-path"));
  assert(!JSON.stringify(result).includes(path));
});
test("range and push checks include commit messages and ref names", (t) => {
  const { cwd, git, base } = fixture(t);
  const value = "gh" + "p_" + "M".repeat(36);
  git("commit", "--allow-empty", "-qm", value);
  assert(
    checkRange(cwd, base).some((issue) => issue.rule === "credential-pattern"),
  );
  const head = git("rev-parse", "HEAD").trim();
  assert(
    checkPush(
      cwd,
      `refs/heads/${value} ${head} refs/heads/work ${base}\n`,
      base,
    ).some((issue) => issue.rule === "credential-ref"),
  );
});
test("review entries cannot waive credentials, modes or size", () => {
  const secret = Buffer.from("gh" + "p_" + "A".repeat(36));
  assert(
    rules(
      article,
      secret,
      "100644",
      reviews(approval(article, secret)),
    ).includes("credential-pattern"),
  );
  assert(rules("link.ts", code, "120000").includes("unsupported-git-mode"));
  assert(rules("module", code, "160000").includes("unsupported-git-mode"));
  assert(
    rules("large.txt", Buffer.alloc(8 * 1024 * 1024 + 1, 65)).includes(
      "blob-too-large",
    ),
  );
});
test("malformed, duplicate, incomplete and invalid-date reviews fail closed", () => {
  const entry = approval(article, published);
  for (const value of [
    { version: 2, entries: [] },
    { version: 1, entries: [entry, entry] },
    { version: 1, entries: [{ ...entry, checks: {} }] },
    { version: 1, entries: [{ ...entry, reviewedOn: "2026-02-30" }] },
    { version: 1, entries: [{ ...entry, path: "../outside" }] },
  ]) {
    assert.throws(() => readReviews(Buffer.from(JSON.stringify(value))));
  }
});
function fixture(t: TestContext) {
  const cwd = mkdtempSync(join(tmpdir(), "publication-gate-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  const put = (path: string, value: string) => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true });
    writeFileSync(join(cwd, path), value);
  };
  git("init", "-q");
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "commit.gpgsign", "false");
  put(REVIEW_FILE, JSON.stringify({ version: 1, entries: [] }));
  git("add", REVIEW_FILE);
  git("commit", "-qm", "baseline");
  const base = git("rev-parse", "HEAD").trim();
  return { cwd, git, put, base };
}
test("staged checks read the index, not a sanitized working copy, and never write", (t) => {
  const { cwd, put, git } = fixture(t);
  const value = "gh" + "p_" + "S".repeat(36);
  put("example.txt", value);
  git("add", "example.txt");
  put("example.txt", "safe working copy");
  const before = git("diff", "--cached");
  assert(checkStaged(cwd).some((issue) => issue.rule === "credential-pattern"));
  assert.equal(git("diff", "--cached"), before);
  assert.equal(
    readFileSync(join(cwd, "example.txt"), "utf8"),
    "safe working copy",
  );
});
test("a review must be staged alongside the exact public file", (t) => {
  const { cwd, put, git } = fixture(t);
  put(article, published.toString());
  git("add", article);
  put(
    REVIEW_FILE,
    JSON.stringify({ version: 1, entries: [approval(article, published)] }),
  );
  assert(
    checkStaged(cwd).some((issue) => issue.rule === "public-review-required"),
  );
  git("add", REVIEW_FILE);
  assert.deepEqual(checkStaged(cwd), []);
});
test("range checks find credentials introduced and removed in intermediate commits", (t) => {
  const { cwd, put, git, base } = fixture(t);
  put("temporary.txt", "gh" + "p_" + "Z".repeat(36));
  git("add", "temporary.txt");
  git("commit", "-qm", "introduce");
  const introduced = git("rev-parse", "HEAD").trim();
  git("rm", "temporary.txt");
  git("commit", "-qm", "remove");
  assert.equal(git("diff", "--name-only", base, "HEAD").trim(), "");
  assert(
    checkRange(cwd, base).some(
      (issue) =>
        issue.commit === introduced && issue.rule === "credential-pattern",
    ),
  );
  const head = git("rev-parse", "HEAD").trim();
  assert(
    checkPush(
      cwd,
      `refs/heads/work ${head} refs/heads/work ${"0".repeat(40)}\n`,
      base,
    ).length > 0,
  );
});
test("private forced additions fail and deletions do not read missing blobs", (t) => {
  const { cwd, put, git } = fixture(t);
  put(".private/data.txt", "private fixture");
  git("add", "-f", ".private/data.txt");
  assert(checkStaged(cwd).some((issue) => issue.rule === "private-material"));
  git("commit", "-qm", "fixture");
  git("rm", ".private/data.txt");
  assert.deepEqual(checkStaged(cwd), []);
});
test("push handles deletions and rejects missing objects and malformed updates", (t) => {
  const { cwd, base } = fixture(t);
  assert.deepEqual(
    checkPush(
      cwd,
      `refs/heads/work ${"0".repeat(40)} refs/heads/work ${base}\n`,
      base,
    ),
    [],
  );
  assert.throws(() => checkPush(cwd, "invalid", base));
  assert.throws(() =>
    checkPush(
      cwd,
      `refs/heads/work ${base} refs/heads/work ${"1".repeat(40)}\n`,
      base,
    ),
  );
});
test("literal special-character filenames are checked without broad path matching", (t) => {
  const { cwd, put, git } = fixture(t);
  put("sample[1].txt", "gh" + "p_" + "F".repeat(36));
  put("sample1.txt", "safe");
  git("add", ".");
  assert(
    checkStaged(cwd).some(
      (issue) =>
        issue.fileId === digest("sample[1].txt") &&
        issue.rule === "credential-pattern",
    ),
  );
});
test("an existing remote before adoption does not reapprove all legacy files", (t) => {
  const { cwd, put, git, base } = fixture(t);
  put(article, published.toString());
  git("add", article);
  git("commit", "-qm", "legacy public file");
  const adoption = git("rev-parse", "HEAD").trim();
  put("new-code.ts", code.toString());
  git("add", "new-code.ts");
  git("commit", "-qm", "code");
  const head = git("rev-parse", "HEAD").trim();
  assert.deepEqual(
    checkPush(
      cwd,
      `refs/heads/work ${head} refs/heads/work ${base}\n`,
      adoption,
    ),
    [],
  );
});
test("signed URLs are blocked and long unstructured text remains bounded", () => {
  const value = "https://example.invalid/image?sig=" + "S".repeat(32);
  assert(rules("note.md", Buffer.from(value)).includes("credential-pattern"));
  assert.deepEqual(rules("text.txt", Buffer.alloc(1024 * 1024, 65)), []);
});
test("hooks and CI keep staged, history and artifact privacy checks connected", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert(pkg["simple-git-hooks"]["pre-commit"].includes("publication:staged"));
  assert.equal(
    pkg["simple-git-hooks"]["pre-push"],
    "./scripts/pnpmw.sh publication:push",
  );
  assert(pkg["simple-git-hooks"]["commit-msg"].includes("publication:message"));
  assert(pkg["simple-git-hooks"]["commit-msg"].includes("exec commitlint"));
  assert(
    readFileSync(
      join(root, ".github/workflows/documentation.yml"),
      "utf8",
    ).includes('pnpm publication:check --base "$BASE_SHA"'),
  );
  assert(
    readFileSync(join(root, ".github/workflows/ci.yml"), "utf8").includes(
      "!cancelled() && vars.DOCS_ALLOW_PUBLIC_SYNTHETIC_EVIDENCE == 'true'",
    ),
  );
  assert.doesNotThrow(() => readReviews(readFileSync(join(root, REVIEW_FILE))));
});
test("CLI failures redact content and reject unknown options", (t) => {
  const { cwd, put, git } = fixture(t);
  const value = "gh" + "p_" + "T".repeat(36);
  put("secret-private-name.txt", value);
  git("add", "secret-private-name.txt");
  const cli = fileURLToPath(
    new URL("./check-publication.mts", import.meta.url),
  );
  for (const args of [["--staged"], ["--base", "missing-ref"], ["--unknown"]]) {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd,
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert(!result.stderr.includes(value));
    assert(!result.stderr.includes("secret-private-name.txt"));
  }
});

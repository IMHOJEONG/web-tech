import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isUtf8 } from "node:buffer";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const ADOPTION_BASE = "28fedc40cd72b729bfa69fcf9e2dde736402d53d";
export const REVIEW_FILE = ".publication-review.json";
const maxBytes = 8 * 1024 * 1024;
const kinds = [
  "article",
  "asset",
  "document",
  "sanitized-evidence",
  "synthetic-fixture",
];
type Review = {
  path: string;
  sha256: string;
  kind: string;
  reviewedOn: string;
  note: string;
};
export type Finding = { fileId: string; rule: string; commit?: string };
export const digest = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const finding = (path: string, rule: string): Finding => ({
  fileId: digest(path),
  rule,
});

function hasCredential(text: string): boolean {
  return (
    /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/.test(text) ||
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/.test(
      text,
    ) ||
    /\bBearer\s+[A-Za-z0-9+/_=-]{20,}/i.test(text) ||
    /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/.test(
      text,
    ) ||
    /(?:token|secret|password|api[_-]?key)["']?\s*[:=]\s*["'][A-Za-z0-9+_\/-]{20,}["']/i.test(
      text,
    ) ||
    /[?&](?:token|api[_-]?key|secret|signature|sig|x-amz-signature)=[^&\s"'<>]{12,}/i.test(
      text,
    ) ||
    /\b[a-z][a-z0-9+.-]{0,31}:\/\/[^\s/:@]{1,256}:[^\s/@]{1,1024}@/i.test(text)
  );
}

function isFixtureData(path: string): boolean {
  if (/\.(?:[cm]?[jt]sx?)$/.test(path)) return false;
  const segments = path.split("/").slice(0, -1);
  let inTestDirectory = false;
  for (const part of segments) {
    if (
      ["fixtures", "test-data", "experiment-data"].includes(part) ||
      (part === "data" && inTestDirectory)
    )
      return true;
    inTestDirectory ||=
      ["test", "tests", "e2e"].includes(part) || /^[a-z0-9-]+-e2e$/.test(part);
  }
  return false;
}

export function readReviews(bytes: Buffer): Review[] {
  if (bytes.length > maxBytes || !isUtf8(bytes)) throw Error();
  const value = JSON.parse(bytes.toString("utf8"));
  if (value.version !== 1 || !Array.isArray(value.entries)) throw Error();
  const seen = new Set<string>();
  for (const entry of value.entries) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      !entry.path ||
      /[\\\x00-\x1f]/.test(entry.path) ||
      entry.path.startsWith("/") ||
      entry.path
        .split("/")
        .some((part: string) => !part || part === "." || part === "..") ||
      seen.has(entry.path) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      !kinds.includes(entry.kind) ||
      entry.decision !== "public-approved" ||
      typeof entry.note !== "string" ||
      entry.note.trim().length < 10 ||
      entry.note.length > 500 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedOn) ||
      Number.isNaN(Date.parse(entry.reviewedOn)) ||
      new Date(entry.reviewedOn).toISOString().slice(0, 10) !==
        entry.reviewedOn ||
      !["secrets", "personalData", "rights", "publicIntent"].every(
        (key) => entry.checks?.[key] === true,
      )
    )
      throw Error();
    seen.add(entry.path);
  }
  return value.entries;
}

export function inspect(
  path: string,
  bytes: Buffer,
  mode: string,
  reviews: Review[],
): Finding[] {
  const rules = new Set<string>();
  const name = path.split("/").at(-1) ?? "";
  if (hasCredential(path)) rules.add("credential-path");
  if (
    /(^|\/)(?:\.private|private|secrets|raw-data|recordings|test-results|playwright-report|coverage|node_modules|\.vercel)(\/|$)/i.test(
      path,
    ) ||
    (/^\.env(?:\.|$)/i.test(name) &&
      !/^\.env\.(?:example|template)$/i.test(name)) ||
    /\.(?:pem|key|p12|pfx|har|pcap|pcapng|sqlite|sqlite3|db|dump|zip|tgz|gz|7z)$/i.test(
      name,
    )
  )
    rules.add("private-material");
  if (mode !== "100644" && mode !== "100755") rules.add("unsupported-git-mode");
  if (bytes.length > maxBytes)
    return [...rules, "blob-too-large"].map((rule) => finding(path, rule));
  const text =
    isUtf8(bytes) && !bytes.includes(0) ? bytes.toString("utf8") : null;
  if (text !== null) {
    if (hasCredential(text)) rules.add("credential-pattern");
    const frontmatter = text.match(
      /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
    )?.[1];
    if (
      frontmatter &&
      /^visibility:\s*["']?(?:private|internal)["']?\s*$/im.test(frontmatter)
    )
      rules.add("private-visibility");
    if (
      /^apps\/docs\/(?:data|category)\/.*\.(?:md|mdx)$/i.test(path) &&
      (!frontmatter || !/^status:\s*["']?published["']?\s*$/m.test(frontmatter))
    )
      rules.add("nonpublished-article");
  }
  let kind: string | undefined;
  if (/^apps\/docs\/(?:data|category)\/.*\.(?:md|mdx)$/i.test(path))
    kind = "article";
  else if (path.startsWith("apps/docs/public/") || text === null)
    kind = "asset";
  else if (
    path.startsWith("docs/verification/artifacts/") &&
    !path.endsWith("/README.md")
  )
    kind = "sanitized-evidence";
  else if (path.startsWith("docs/") && /\.(?:md|mdx)$/i.test(path))
    kind = "document";
  else if (isFixtureData(path)) kind = "synthetic-fixture";
  if (
    kind &&
    !reviews.some(
      (r) => r.path === path && r.kind === kind && r.sha256 === digest(bytes),
    )
  )
    rules.add("public-review-required");
  return [...rules].map((rule) => finding(path, rule));
}

function git(cwd: string, ...args: string[]) {
  return execFileSync("git", ["--literal-pathspecs", ...args], {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
}
function blob(cwd: string, ref: string, path: string) {
  return git(cwd, "show", `${ref}:${path}`);
}
function checkSnapshot(cwd: string, ref: string, paths: string[]): Finding[] {
  const issues: Finding[] = [];
  let reviews: Review[] = [];
  try {
    reviews = readReviews(blob(cwd, ref, REVIEW_FILE));
  } catch {
    issues.push(finding(REVIEW_FILE, "invalid-review-manifest"));
  }
  for (const path of paths) {
    const bytes = blob(cwd, ref, path);
    const raw =
      ref === ""
        ? git(cwd, "ls-files", "--stage", "-z", "--", path)
        : git(cwd, "ls-tree", "-z", ref, "--", path);
    const entries = raw.toString("utf8").split("\0").filter(Boolean);
    if (entries.length !== 1) throw Error();
    const mode = entries[0]!.split(" ")[0]!;
    issues.push(...inspect(path, bytes, mode, reviews));
  }
  return issues;
}
const split = (bytes: Buffer) =>
  bytes.toString("utf8").split("\0").filter(Boolean);
export function checkStaged(cwd: string): Finding[] {
  if (git(cwd, "ls-files", "--unmerged").length) throw Error();
  return checkSnapshot(
    cwd,
    "",
    split(
      git(
        cwd,
        "diff",
        "--cached",
        "--no-renames",
        "--name-only",
        "--diff-filter=ACMRT",
        "-z",
      ),
    ),
  );
}
export function checkRange(
  cwd: string,
  base: string,
  head = "HEAD",
  baseline = ADOPTION_BASE,
): Finding[] {
  const newRef = /^0{40}$/.test(base);
  const baseOid = git(
    cwd,
    "rev-parse",
    "--verify",
    `${newRef ? baseline : base}^{commit}`,
  )
    .toString()
    .trim();
  const headOid = git(cwd, "rev-parse", "--verify", `${head}^{commit}`)
    .toString()
    .trim();
  git(cwd, "merge-base", "--is-ancestor", baseOid, headOid);
  const commits = git(cwd, "rev-list", "--reverse", `${baseOid}..${headOid}`)
    .toString()
    .trim()
    .split("\n")
    .filter(Boolean);
  return checkCommits(cwd, commits);
}

function inspectTagChain(cwd: string, object: string): Finding[] {
  const findings: Finding[] = [];
  const visited = new Set<string>();
  while (git(cwd, "cat-file", "-t", object).toString().trim() === "tag") {
    if (visited.has(object) || visited.size >= 100) throw Error();
    visited.add(object);
    const bytes = git(cwd, "cat-file", "tag", object);
    findings.push(...inspect("tag-annotation", bytes, "100644", []));
    if (bytes.length > maxBytes) return findings;
    const target = bytes
      .toString("utf8")
      .match(/^object ([a-f0-9]{40})\n/)?.[1];
    if (!target) throw Error();
    object = target;
  }
  return findings;
}
function checkCommits(cwd: string, commits: string[]): Finding[] {
  if (commits.length > 1000) throw Error();
  return commits.flatMap((commit) => {
    const parent = git(cwd, "rev-parse", `${commit}^1`).toString().trim();
    const paths = split(
      git(
        cwd,
        "diff",
        "--no-renames",
        "--name-only",
        "--diff-filter=ACMRT",
        "-z",
        parent,
        commit,
      ),
    );
    const message = inspect(
      "commit-message",
      git(cwd, "show", "-s", "--format=%B", commit),
      "100644",
      [],
    );
    return [...checkSnapshot(cwd, commit, paths), ...message].map((entry) => ({
      ...entry,
      commit,
    }));
  });
}
export function checkPush(
  cwd: string,
  input: string,
  baseline = ADOPTION_BASE,
): Finding[] {
  return input
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.trim().split(/\s+/);
      if (
        parts.length !== 4 ||
        !/^[a-f0-9]{40}$/.test(parts[1]!) ||
        !/^[a-f0-9]{40}$/.test(parts[3]!)
      )
        throw Error();
      const head = parts[1]!,
        remote = parts[3]!;
      if (/^0+$/.test(head)) return [];
      if (hasCredential(parts[0]!) || hasCredential(parts[2]!))
        return [finding("push-ref", "credential-ref")];
      git(cwd, "merge-base", "--is-ancestor", baseline, head);
      if (!/^0+$/.test(remote)) {
        git(cwd, "rev-parse", "--verify", `${remote}^{commit}`);
        git(cwd, "merge-base", "--is-ancestor", remote, head);
      }
      const annotations = inspectTagChain(cwd, head);
      const commits = git(
        cwd,
        "rev-list",
        "--reverse",
        head,
        "--not",
        baseline,
        ...(/^0+$/.test(remote) ? [] : [remote]),
      )
        .toString()
        .trim()
        .split("\n")
        .filter(Boolean);
      return [...annotations, ...checkCommits(cwd, commits)];
    });
}
export function main(args: string[], cwd = process.cwd()): number {
  try {
    let issues: Finding[];
    if (args.length === 1 && args[0] === "--staged") issues = checkStaged(cwd);
    else if (args.length === 1 && args[0] === "--pre-push")
      issues = checkPush(cwd, readFileSync(0, "utf8"));
    else if (args.length === 2 && args[0] === "--message")
      issues = inspect("commit-message", readFileSync(args[1]!), "100644", []);
    else if (
      args.length === 2 &&
      args[0] === "--base" &&
      /^[A-Za-z0-9_/.~-]+$/.test(args[1]!) &&
      !args[1]!.startsWith("-")
    )
      issues = checkRange(cwd, args[1]!);
    else throw Error();
    if (issues.length) {
      console.error(JSON.stringify({ status: "blocked", findings: issues }));
      return 1;
    }
    console.log(
      "Publication boundary checks passed (delta only; not a full secret audit).",
    );
    return 0;
  } catch {
    console.error(
      "Publication check unavailable or invalid input. No source content printed.",
    );
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exitCode = main(process.argv.slice(2));

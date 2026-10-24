import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export function verificationGitEnvironment(source = process.env) {
  return Object.fromEntries(
    Object.entries(source).filter(([key]) => !/^GIT_/i.test(key)),
  );
}

/** Resolve once: later commits or moving branch refs cannot change this snapshot. */
export function resolveVerificationBaseline(root: string, args: string[]) {
  if (
    args.length !== 2 ||
    args[0] !== "--base" ||
    !args[1] ||
    !/^[A-Za-z0-9][A-Za-z0-9_./~^{}@-]*$/.test(args[1])
  )
    throw new Error(
      "Usage: --base <commit-or-ref> (explicit baseline required)",
    );
  const ref = args[1];
  const env = verificationGitEnvironment();
  const git = (...parameters: string[]) =>
    execFileSync("git", parameters, {
      cwd: root,
      env,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  let sha: string;
  try {
    sha = git("rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`)
      .toString()
      .trim();
  } catch {
    throw new Error("Baseline must resolve to an existing commit; no fallback");
  }
  assert.match(sha, /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/);
  return {
    ref,
    sha,
    readFile: (file: string) => git("show", `${sha}:${file}`),
    files: () =>
      git("ls-tree", "-r", "--name-only", "-z", sha)
        .toString()
        .split("\0")
        .filter(Boolean),
  };
}

export type VerificationBaseline = ReturnType<
  typeof resolveVerificationBaseline
>;

export function assertBaselineFilesUnchanged(
  baseline: VerificationBaseline,
  root: string,
  files: string[],
) {
  for (const file of files)
    assert.equal(
      readFileSync(join(root, file), "utf8"),
      baseline.readFile(file).toString(),
      `${file}: differs from baseline ${baseline.sha}`,
    );
}

export function assertBaselineAppScriptsUnchanged(
  baseline: VerificationBaseline,
  root: string,
  manifestPath: string,
  scripts: string[],
) {
  const previous = JSON.parse(baseline.readFile(manifestPath).toString());
  const current = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
  for (const script of scripts)
    assert.equal(
      current.scripts[script],
      previous.scripts[script],
      `${manifestPath}:${script}: differs from baseline ${baseline.sha}`,
    );
}

export async function copyBaselineManifests(
  baseline: VerificationBaseline,
  destination: string,
) {
  const files = baseline
    .files()
    .filter((file) =>
      /^(?:package\.json|pnpm-workspace\.yaml|pnpm-lock\.yaml|\.mise\.toml|(?:apps|packages)\/[^/]+\/package\.json)$/.test(
        file,
      ),
    );
  for (const file of files) {
    await mkdir(dirname(join(destination, file)), { recursive: true });
    await writeFile(join(destination, file), baseline.readFile(file));
  }
  return files;
}

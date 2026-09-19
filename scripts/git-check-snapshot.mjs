import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function isMain(url) {
  return process.argv[1] && url === pathToFileURL(process.argv[1]).href;
}

export function snapshot(args = process.argv.slice(2), cwd = process.cwd()) {
  const git = (...args) =>
    execFileSync("git", args, {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
  if (
    args.length &&
    !(args.length === 1 && args[0] === "--staged") &&
    !(
      args.length === 2 &&
      args[0] === "--base" &&
      /^[a-zA-Z0-9_/.~-]+$/.test(args[1]) &&
      !args[1].startsWith("-")
    )
  ) {
    throw new Error("Use --staged or --base <commit>");
  }
  const staged = args[0] !== "--base";
  let base;
  if (staged) {
    try {
      base = git("rev-parse", "--verify", "HEAD").toString().trim();
    } catch {
      base = git("hash-object", "-t", "tree", "--stdin").toString().trim();
    }
  } else {
    base = git("rev-parse", "--verify", `${args[1]}^{tree}`).toString().trim();
  }
  if (staged && git("ls-files", "--unmerged").length)
    throw new Error("Resolve merge conflicts first");
  const list = (buffer) =>
    new Set(buffer.toString().split("\0").filter(Boolean));
  const oldFiles = list(git("ls-tree", "-r", "--name-only", "-z", base));
  const files = list(
    staged
      ? git("ls-files", "--cached", "-z")
      : git("ls-tree", "-r", "--name-only", "-z", "HEAD"),
  );
  const fields = git(
    "diff",
    ...(staged ? ["--cached"] : []),
    "--name-status",
    "-z",
    "--find-renames",
    base,
    ...(staged ? [] : ["HEAD"]),
    "--",
  )
    .toString()
    .split("\0")
    .filter(Boolean);
  const changes = [];
  while (fields.length) {
    const status = fields.shift();
    const old = fields.shift();
    const file = /^[RC]/.test(status) ? fields.shift() : old;
    changes.push({ status, file, old });
  }
  const read = (file, before = false) => {
    const inventory = before ? oldFiles : files;
    if (!inventory.has(file)) return null;
    return git(
      "show",
      before ? `${base}:${file}` : staged ? `:${file}` : `HEAD:${file}`,
    );
  };
  return { files, oldFiles, changes, read, staged };
}

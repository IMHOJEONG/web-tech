import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { isUtf8 } from "node:buffer";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const maxMessageBytes = 64 * 1024;

export type Options = {
  repo: string;
  pr: string;
  expectedHead: string;
  messageFile: string;
  merge: boolean;
};
export type Runner = (
  command: string,
  args: string[],
  input?: string,
) => string;

export const runCommand: Runner = (command, args, input) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    input,
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} failed (${result.status ?? result.signal}):\n${result.stdout}${result.stderr}`,
    );
  }
  return result.stdout;
};

export function parseOptions(args: string[]): Options {
  const { values } = parseArgs({
    args: args[0] === "--" ? args.slice(1) : args,
    strict: true,
    allowPositionals: false,
    options: {
      repo: { type: "string" },
      pr: { type: "string" },
      "expected-head": { type: "string" },
      "message-file": { type: "string" },
      merge: { type: "boolean", default: false },
    },
  });
  const options = {
    repo: values.repo ?? "",
    pr: values.pr ?? "",
    expectedHead: values["expected-head"] ?? "",
    messageFile: values["message-file"] ?? "",
    merge: values.merge,
  };
  assertOptions(options);
  return options;
}

function assertOptions(options: Options) {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(
      options.repo,
    ) ||
    !/^[1-9]\d*$/.test(options.pr) ||
    !/^[a-f0-9]{40}$/.test(options.expectedHead) ||
    !options.messageFile
  ) {
    throw new Error(
      "Required: --repo OWNER/REPO --pr NUMBER --expected-head FULL_SHA --message-file PATH [--merge]",
    );
  }
}

export function readMessage(file: string) {
  const bytes = readFileSync(file);
  if (bytes.length > maxMessageBytes || !isUtf8(bytes)) {
    throw new Error("Message must be UTF-8 and at most 64 KiB.");
  }
  const text = bytes
    .toString("utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\n+$/, "");
  if (/[\0\r\uFEFF]/.test(text)) {
    throw new Error("Message must not contain NUL, bare CR or BOM.");
  }
  const [subject, separator, ...rest] = text.split("\n");
  if (!subject || subject !== subject.trim()) {
    throw new Error("Message must begin with a nonempty, unpadded subject.");
  }
  if (separator !== undefined && separator !== "") {
    throw new Error("Separate the subject and body with a blank line.");
  }
  const body = rest.join("\n");
  const message = `${subject}${body ? `\n\n${body}` : ""}\n`;
  return { subject, body, message };
}

export function lintMessage(message: string, run: Runner = runCommand) {
  return run(
    process.execPath,
    [
      join(root, "node_modules/@commitlint/cli/cli.js"),
      "--config",
      join(root, "scripts/squash-commitlint.config.mjs"),
      "--strict",
      "--verbose",
    ],
    message,
  );
}

type PullRequest = {
  state: string;
  baseRefName: string;
  headRefOid: string;
  isDraft: boolean;
  mergeable: string;
  mergeStateStatus: string;
  reviewDecision: string | null;
  statusCheckRollup: Array<{
    __typename: string;
    name?: string;
    status?: string;
    conclusion?: string;
    state?: string;
  }>;
};

function isSuccessfulCheck(check: PullRequest["statusCheckRollup"][number]) {
  return check.__typename === "CheckRun"
    ? check.status === "COMPLETED" && check.conclusion === "SUCCESS"
    : check.__typename === "StatusContext" && check.state === "SUCCESS";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function verifyRateLimit(repo: string, head: string, run: Runner) {
  const pages: unknown = JSON.parse(
    run("gh", [
      "api",
      `repos/${repo}/commits/${head}/check-runs?filter=latest&per_page=100`,
      "--paginate",
      "--slurp",
    ]),
  );
  if (!Array.isArray(pages) || pages.length === 0)
    throw new Error("Cannot verify CodeRabbit rate-limit evidence.");
  const checks: unknown[] = pages.flatMap((page: unknown) => {
    if (!isRecord(page) || !Array.isArray(page.check_runs))
      throw new Error("Cannot verify CodeRabbit rate-limit evidence.");
    return page.check_runs as unknown[];
  });
  const matches = checks.filter(
    (check) => isRecord(check) && check.name === "CodeRabbit",
  );
  const check = matches[0];
  if (
    matches.length !== 1 ||
    !isRecord(check) ||
    typeof check.id !== "number" ||
    !Number.isSafeInteger(check.id) ||
    check.id <= 0 ||
    check.head_sha !== head ||
    check.status !== "completed" ||
    check.conclusion !== "neutral" ||
    !isRecord(check.app) ||
    check.app.id !== 347564 ||
    check.app.slug !== "coderabbitai" ||
    !isRecord(check.app.owner) ||
    check.app.owner.login !== "coderabbitai" ||
    !isRecord(check.output) ||
    check.output.title !== "Review rate limited" ||
    typeof check.output.summary !== "string" ||
    check.output.summary.split("\n")[0] !==
      "Result: Rate limited - Review rate limited"
  ) {
    throw new Error("Cannot verify CodeRabbit rate-limit evidence.");
  }
  return {
    checkName: "CodeRabbit",
    checkRunId: check.id,
    headSha: head,
    reason: "coderabbit-review-rate-limit",
    reviewPerformed: false,
  };
}

function assertReady(pr: PullRequest, options: Options, run: Runner) {
  const expectedHead = options.expectedHead;
  if (pr.headRefOid !== expectedHead)
    throw new Error("PR head changed; review the new SHA.");
  if (
    pr.state !== "OPEN" ||
    pr.baseRefName !== "main" ||
    pr.isDraft !== false ||
    pr.mergeable !== "MERGEABLE" ||
    pr.mergeStateStatus !== "CLEAN" ||
    !["", null, "APPROVED"].includes(pr.reviewDecision)
  ) {
    throw new Error("PR must be open, ready and clean against main.");
  }
  if (!Array.isArray(pr.statusCheckRollup) || pr.statusCheckRollup.length === 0)
    throw new Error("Every reported CI/status check must have succeeded.");
  const blocked = pr.statusCheckRollup.filter(
    (check) => !isSuccessfulCheck(check),
  );
  if (blocked.length === 0) return [];
  // Only the official app's exact quota result can be advisory, not a generic skip.
  const candidate = blocked[0];
  if (
    blocked.length !== 1 ||
    candidate.__typename !== "CheckRun" ||
    candidate.name !== "CodeRabbit" ||
    candidate.status !== "COMPLETED" ||
    candidate.conclusion !== "NEUTRAL" ||
    !pr.statusCheckRollup.some(isSuccessfulCheck)
  )
    throw new Error("Every reported CI/status check must have succeeded.");
  return [verifyRateLimit(options.repo, expectedHead, run)];
}

export function executeSquash(options: Options, run: Runner = runCommand) {
  assertOptions(options);
  // Lint this in-memory snapshot and send the same snapshot, never re-read the source.
  const { subject, body, message } = readMessage(options.messageFile);
  lintMessage(message, run);
  const pr: PullRequest = JSON.parse(
    run("gh", [
      "pr",
      "view",
      options.pr,
      "--repo",
      options.repo,
      "--json",
      "state,baseRefName,headRefOid,isDraft,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup",
    ]),
  );
  const checkExceptions = assertReady(pr, options, run);
  const digest = createHash("sha256").update(message).digest("hex");
  if (options.merge) {
    const directory = mkdtempSync(join(tmpdir(), "squash-message-"));
    try {
      const bodyFile = join(directory, "body.txt");
      writeFileSync(bodyFile, body, { mode: 0o600, flag: "wx" });
      run("gh", [
        "pr",
        "merge",
        options.pr,
        "--repo",
        options.repo,
        "--squash",
        "--match-head-commit",
        options.expectedHead,
        "--subject",
        subject,
        "--body-file",
        bodyFile,
      ]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
  return {
    action: options.merge ? "merge-requested" : "check-only",
    repo: options.repo,
    pr: options.pr,
    expectedHead: options.expectedHead,
    messageSha256: digest,
    subject,
    checkExceptions,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    console.log(
      JSON.stringify(
        executeSquash(parseOptions(process.argv.slice(2))),
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

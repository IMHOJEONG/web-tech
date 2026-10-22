import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import {
  executeSquash,
  lintMessage,
  parseOptions,
  readMessage,
  runCommand,
  type Options,
  type Runner,
} from "./squash-merge.mts";

const sha = "a".repeat(40);
const valid =
  "ci(repo-ci): validate final squash messages\n\nValidate the exact message before requesting a merge.\n\nRefs: KAN-22\n";
const ready = {
  state: "OPEN",
  baseRefName: "main",
  headRefOid: sha,
  isDraft: false,
  mergeable: "MERGEABLE",
  mergeStateStatus: "CLEAN",
  reviewDecision: "",
  statusCheckRollup: [
    { __typename: "CheckRun", status: "COMPLETED", conclusion: "SUCCESS" },
    { __typename: "StatusContext", state: "SUCCESS" },
  ],
};

function fixture(t: TestContext, content: string | Buffer = valid): Options {
  const directory = mkdtempSync(join(tmpdir(), "squash-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const messageFile = join(directory, "message.txt");
  writeFileSync(messageFile, content);
  return {
    repo: "example/project",
    pr: "53",
    expectedHead: sha,
    messageFile,
    merge: false,
  };
}

function runner(pr: object = ready) {
  const calls: Array<{ command: string; args: string[]; input?: string }> = [];
  const run: Runner = (command, args, input) => {
    calls.push({ command, args, input });
    if (command === process.execPath) return runCommand(command, args, input);
    assert.equal(command, "gh");
    if (args[1] === "view") return JSON.stringify(pr);
    assert.equal(args[1], "merge");
    return "";
  };
  return { run, calls };
}

test("PR #53's actual long squash footer is rejected by the installed commitlint", () => {
  const failed =
    "test(docs-app): verify search and retain navigation evidence (KAN-22) (#53)\n\nKAN-22: merge validated navigation instrumentation, CI report and trace retention, documentation, and article-readiness regression coverage.\n";
  assert.throws(() => lintMessage(failed), /footer-max-line-length/);
  assert.doesNotThrow(() => lintMessage(valid));
});

for (const message of [
  "fix[repo-ci]: invalid brackets\n",
  "fix(unknown-scope): invalid scope\n",
  `fix(repo-ci): ${"x".repeat(101)}\n`,
  `fix(repo-ci): reject a long body\n\n${"x".repeat(101)}\n`,
  "Merge branch 'unchecked'\n",
]) {
  test(`real commitlint blocks invalid message: ${message.split("\n")[0].slice(0, 55)}`, (t) => {
    const options = fixture(t, message);
    const { run, calls } = runner();
    assert.throws(
      () => executeSquash({ ...options, merge: true }, run),
      /type-empty|subject-empty|scope-enum|header-max-length|body-max-line-length/,
    );
    assert.equal(calls.filter((call) => call.command === "gh").length, 0);
  });
}

test("default CLI mode never merges and rejects extra flags or missing identity", () => {
  const args = [
    "--repo",
    "example/project",
    "--pr",
    "53",
    "--expected-head",
    sha,
    "--message-file",
    "/tmp/message.txt",
  ];
  assert.equal(parseOptions(args).merge, false);
  assert.equal(parseOptions(["--", ...args, "--merge"]).merge, true);
  for (const invalid of [
    [...args, "--admin"],
    [...args, "--auto"],
    [...args, "extra"],
    ["--pr", "53"],
    [...args, "--pr", "--squash"],
    [...args, "--expected-head", "short"],
    [...args, "--repo", "--other"],
  ])
    assert.throws(() => parseOptions(invalid));
});

test("check-only lints the complete snapshot before querying the explicit PR", (t) => {
  const options = fixture(t);
  const { run, calls } = runner();
  const result = executeSquash(options, run);
  assert.equal(result.action, "check-only");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].input, valid);
  assert.equal(calls[1].command, "gh");
  assert.ok(calls[1].args.includes(options.repo));
  assert.ok(calls[1].args.includes(options.pr));
  assert.equal(
    result.messageSha256,
    createHash("sha256").update(valid).digest("hex"),
  );
});

for (const [label, patch] of Object.entries({
  "stale head": { headRefOid: "b".repeat(40) },
  "merged PR": { state: "MERGED" },
  "wrong base": { baseRefName: "feature/docs" },
  draft: { isDraft: true },
  "unknown mergeability": { mergeable: "UNKNOWN" },
  "behind base": { mergeStateStatus: "BEHIND" },
  "changes requested": { reviewDecision: "CHANGES_REQUESTED" },
  "review required": { reviewDecision: "REVIEW_REQUIRED" },
  "missing checks": { statusCheckRollup: [] },
  "pending check": {
    statusCheckRollup: [
      { __typename: "CheckRun", status: "IN_PROGRESS", conclusion: "" },
    ],
  },
  "failed check": {
    statusCheckRollup: [
      { __typename: "CheckRun", status: "COMPLETED", conclusion: "FAILURE" },
    ],
  },
  "skipped check": {
    statusCheckRollup: [
      { __typename: "CheckRun", status: "COMPLETED", conclusion: "SKIPPED" },
    ],
  },
  "pending context": {
    statusCheckRollup: [{ __typename: "StatusContext", state: "PENDING" }],
  },
  "unknown check shape": {
    statusCheckRollup: [{ __typename: "Unknown", state: "SUCCESS" }],
  },
})) {
  test(`merge is blocked for ${label}`, (t) => {
    const options = fixture(t);
    const { run, calls } = runner({ ...structuredClone(ready), ...patch });
    assert.throws(
      () => executeSquash({ ...options, merge: true }, run),
      /PR head changed|PR must be open|Every reported CI/,
    );
    assert.equal(
      calls.some((call) => call.args[1] === "merge"),
      false,
    );
  });
}

test("merge sends the linted snapshot, pins the head and cleans its private body file", (t) => {
  const options = fixture(t, valid.replace(/\n/g, "\r\n"));
  let bodyFile = "";
  let linted = "";
  const run: Runner = (command, args, input) => {
    if (command === process.execPath) {
      linted = input!;
      return runCommand(command, args, input);
    }
    if (args[1] === "view") {
      writeFileSync(options.messageFile, "changed after validation");
      return JSON.stringify(ready);
    }
    assert.equal(command, "gh");
    assert.deepEqual(args.slice(0, 5), [
      "pr",
      "merge",
      "53",
      "--repo",
      options.repo,
    ]);
    assert.equal(args[args.indexOf("--match-head-commit") + 1], sha);
    assert.ok(args.includes("--squash"));
    assert.ok(!args.includes("--admin") && !args.includes("--auto"));
    bodyFile = args[args.indexOf("--body-file") + 1];
    assert.equal(statSync(bodyFile).mode & 0o777, 0o600);
    const subject = args[args.indexOf("--subject") + 1];
    assert.equal(`${subject}\n\n${readFileSync(bodyFile, "utf8")}\n`, linted);
    return "";
  };
  assert.equal(
    executeSquash({ ...options, merge: true }, run).action,
    "merge-requested",
  );
  assert.equal(linted, valid);
  assert.equal(existsSync(bodyFile), false);
});

test("merge failure is propagated and temporary message is still removed", (t) => {
  const options = fixture(t);
  let bodyFile = "";
  const { run: normal } = runner();
  const run: Runner = (command, args, input) => {
    if (command === "gh" && args[1] === "merge") {
      bodyFile = args[args.indexOf("--body-file") + 1];
      throw new Error("head changed on GitHub");
    }
    return normal(command, args, input);
  };
  assert.throws(
    () => executeSquash({ ...options, merge: true }, run),
    /head changed on GitHub/,
  );
  assert.equal(existsSync(bodyFile), false);
});

test("subject-only and shell metacharacters are passed as literal arguments", (t) => {
  const text = 'fix(repo-ci): preserve $(echo unsafe); quotes "literally"\n';
  const options = fixture(t, text);
  const { run: normal, calls } = runner();
  let body = "not empty";
  const run: Runner = (command, args, input) => {
    if (command === "gh" && args[1] === "merge")
      body = readFileSync(args.at(-1)!, "utf8");
    return normal(command, args, input);
  };
  executeSquash({ ...options, merge: true }, run);
  const call = calls.at(-1)!;
  assert.equal(call.args[call.args.indexOf("--subject") + 1], text.trimEnd());
  assert.equal(body, "");
});

for (const [label, text] of Object.entries({
  empty: "",
  padded: " fix(repo-ci): padded\n",
  "missing blank": "fix(repo-ci): title\nbody",
  NUL: "fix(repo-ci): title\0",
  BOM: "\uFEFFfix(repo-ci): title",
  CR: "fix(repo-ci): title\rbody",
  oversized: "x".repeat(64 * 1024 + 1),
})) {
  test(`invalid message file is rejected: ${label}`, (t) => {
    assert.throws(() => readMessage(fixture(t, text).messageFile));
  });
}

test("invalid UTF-8 and missing files fail closed", (t) => {
  assert.throws(() => readMessage(fixture(t, Buffer.from([0xff])).messageFile));
  assert.throws(() =>
    readMessage(join(tmpdir(), "absent-squash-message-" + process.pid)),
  );
});

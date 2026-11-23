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

function runner(pr: object = ready, pages?: unknown) {
  const calls: Array<{ command: string; args: string[]; input?: string }> = [];
  const run: Runner = (command, args, input) => {
    calls.push({ command, args, input });
    if (command === process.execPath) return runCommand(command, args, input);
    assert.equal(command, "gh");
    if (args[0] === "api") {
      assert.notEqual(pages, undefined, "unexpected rate-limit lookup");
      return JSON.stringify(pages);
    }
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
  assert.deepEqual(result.checkExceptions, []);
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

const quotaCheck = {
  __typename: "CheckRun",
  name: "CodeRabbit",
  status: "COMPLETED",
  conclusion: "NEUTRAL",
};
const limited = {
  ...ready,
  statusCheckRollup: [...ready.statusCheckRollup, quotaCheck],
};
const rateLimitedRun = {
  id: 123211021536,
  name: "CodeRabbit",
  head_sha: sha,
  status: "completed",
  conclusion: "neutral",
  app: {
    id: 347564,
    slug: "coderabbitai",
    owner: { login: "coderabbitai" },
  },
  output: {
    title: "Review rate limited",
    summary:
      "Result: Rate limited - Review rate limited\nRun ID: diagnostic-fixture",
  },
};

const fileLimitCheck = { ...quotaCheck, conclusion: "SKIPPED" };
const fileLimited = {
  ...ready,
  changedFiles: 116,
  statusCheckRollup: [...ready.statusCheckRollup, fileLimitCheck],
};
const fileLimitedRun = {
  ...rateLimitedRun,
  conclusion: "skipped",
  output: {
    title: "Review skipped: 116 files exceed the limit of 100",
    summary:
      "Result: Skipped - Review skipped: 116 files exceed the limit of 100\nRun ID: fixture",
  },
};

for (const merge of [false, true]) {
  test(`official file limit is correlated with the PR file count (merge=${merge})`, (t) => {
    const options = { ...fixture(t), merge };
    const { run, calls } = runner(fileLimited, [
      { check_runs: [{ name: "Lint", conclusion: "success" }] },
      { check_runs: [fileLimitedRun] },
    ]);
    const result = executeSquash(options, run);
    assert.deepEqual(result.checkExceptions, [
      {
        checkName: "CodeRabbit",
        checkRunId: fileLimitedRun.id,
        headSha: sha,
        reviewPerformed: false,
        reason: "coderabbit-review-file-limit",
        reportedFiles: 116,
        changedFiles: 116,
        fileLimit: 100,
      },
    ]);
    assert.equal(
      calls.some((c) => c.args[1] === "merge"),
      merge,
    );
    const view = calls.find((c) => c.args[1] === "view")!;
    assert.ok(
      view.args[view.args.indexOf("--json") + 1].includes("changedFiles"),
    );
    if (merge) {
      const call = calls.find((c) => c.args[1] === "merge")!;
      assert.equal(
        call.args[call.args.indexOf("--match-head-commit") + 1],
        sha,
      );
    }
  });
}

for (const [label, patch] of Object.entries({
  "wrong app": { app: { ...fileLimitedRun.app, id: 1 } },
  "wrong slug": { app: { ...fileLimitedRun.app, slug: "impostor" } },
  "wrong owner": {
    app: { ...fileLimitedRun.app, owner: { login: "impostor" } },
  },
  "stale head": { head_sha: "b".repeat(40) },
  unfinished: { status: "in_progress" },
  failure: { conclusion: "failure" },
  "neutral mismatch": { conclusion: "neutral" },
  "missing ID": { id: undefined },
  "generic skip": {
    output: { title: "Review skipped", summary: "Result: Skipped" },
  },
  "count in summary only": {
    output: { ...fileLimitedRun.output, title: "Review skipped" },
  },
  "summary mismatch": {
    output: {
      ...fileLimitedRun.output,
      summary: "Result: Skipped - Other reason",
    },
  },
  "missing output": { output: null },
})) {
  test(`file-limit evidence rejects ${label}`, (t) => {
    const { run, calls } = runner(fileLimited, [
      { check_runs: [{ ...fileLimitedRun, ...patch }] },
    ]);
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Cannot verify/,
    );
    assert.equal(
      calls.some((c) => c.args[1] === "merge"),
      false,
    );
  });
}

for (const count of [undefined, 115, 100, 0, -1, 116.5, "116", null]) {
  test(`file limit rejects uncorrelated PR file count ${String(count)}`, (t) => {
    const { run, calls } = runner({ ...fileLimited, changedFiles: count }, [
      { check_runs: [fileLimitedRun] },
    ]);
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Cannot verify/,
    );
    assert.equal(
      calls.some((c) => c.args[1] === "merge"),
      false,
    );
  });
}

for (const [count, limit] of [
  [100, 100],
  [116, 200],
  ["0116", 100],
  ["9007199254740992", 100],
]) {
  test(`file limit rejects unsupported report ${count}/${limit}`, (t) => {
    const title = `Review skipped: ${count} files exceed the limit of ${limit}`;
    const { run, calls } = runner(
      { ...fileLimited, changedFiles: Number(count) },
      [
        {
          check_runs: [
            {
              ...fileLimitedRun,
              output: { title, summary: `Result: Skipped - ${title}` },
            },
          ],
        },
      ],
    );
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Cannot verify/,
    );
    assert.equal(
      calls.some((c) => c.args[1] === "merge"),
      false,
    );
  });
}

for (const patch of [
  { reviewDecision: "CHANGES_REQUESTED" },
  {
    statusCheckRollup: [
      fileLimitCheck,
      { ...ready.statusCheckRollup[0], conclusion: "FAILURE" },
    ],
  },
  {
    statusCheckRollup: [
      fileLimitCheck,
      { ...quotaCheck, name: "Other", conclusion: "SKIPPED" },
    ],
  },
  { statusCheckRollup: [fileLimitCheck] },
]) {
  test(`file limit does not excuse review or other check failures: ${JSON.stringify(patch)}`, (t) => {
    const { run, calls } = runner({ ...fileLimited, ...patch }, [
      { check_runs: [fileLimitedRun] },
    ]);
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /PR must be open|Every reported CI/,
    );
    assert.equal(
      calls.some((c) => c.args[1] === "merge"),
      false,
    );
  });
}

test("file limit rejects duplicate official check runs", (t) => {
  const { run, calls } = runner(fileLimited, [
    { check_runs: [fileLimitedRun, { ...fileLimitedRun, id: 2 }] },
  ]);
  assert.throws(
    () => executeSquash({ ...fixture(t), merge: true }, run),
    /Cannot verify/,
  );
  assert.equal(
    calls.some((c) => c.args[1] === "merge"),
    false,
  );
});

test("provider file count may be a subset of the PR total and both are audited", (t) => {
  const { run } = runner({ ...fileLimited, changedFiles: 118 }, [
    { check_runs: [fileLimitedRun] },
  ]);
  const result = executeSquash(fixture(t), run);
  assert.deepEqual(result.checkExceptions[0], {
    checkName: "CodeRabbit",
    checkRunId: fileLimitedRun.id,
    headSha: sha,
    reviewPerformed: false,
    reason: "coderabbit-review-file-limit",
    reportedFiles: 116,
    changedFiles: 118,
    fileLimit: 100,
  });
});

test("official rate-limit evidence is checked across pages and recorded without claiming review success", (t) => {
  const options = fixture(t);
  const { run, calls } = runner(limited, [
    { check_runs: [{ name: "Lint", conclusion: "success" }] },
    { check_runs: [rateLimitedRun] },
  ]);
  const result = executeSquash({ ...options, merge: true }, run);
  assert.equal(result.action, "merge-requested");
  assert.deepEqual(result.checkExceptions, [
    {
      checkName: "CodeRabbit",
      checkRunId: rateLimitedRun.id,
      headSha: sha,
      reason: "coderabbit-review-rate-limit",
      reviewPerformed: false,
    },
  ]);
  assert.deepEqual(calls.find((call) => call.args[0] === "api")?.args, [
    "api",
    `repos/${options.repo}/commits/${sha}/check-runs?filter=latest&per_page=100`,
    "--paginate",
    "--slurp",
  ]);
  const merge = calls.find((call) => call.args[1] === "merge")!;
  assert.equal(merge.args[merge.args.indexOf("--match-head-commit") + 1], sha);
  assert.ok(!merge.args.includes("--admin") && !merge.args.includes("--auto"));
});

for (const [label, patch] of Object.entries({
  "untrusted app id": { app: { ...rateLimitedRun.app, id: 1 } },
  "untrusted app slug": { app: { ...rateLimitedRun.app, slug: "impostor" } },
  "untrusted owner": {
    app: { ...rateLimitedRun.app, owner: { login: "impostor" } },
  },
  "missing app": { app: null },
  "stale API head": { head_sha: "b".repeat(40) },
  "unfinished review": { status: "in_progress" },
  "failed review": { conclusion: "failure" },
  "skipped review": { conclusion: "skipped" },
  "generic neutral": {
    output: { title: "Review skipped", summary: rateLimitedRun.output.summary },
  },
  "untrusted summary": {
    output: {
      ...rateLimitedRun.output,
      summary: "Unrelated text mentions Review rate limited",
    },
  },
  "missing evidence": { output: null },
  "missing run id": { id: undefined },
  "invalid run id": { id: 1.5 },
})) {
  test(`rate-limit exception rejects ${label}`, (t) => {
    const { run, calls } = runner(limited, [
      { check_runs: [{ ...rateLimitedRun, ...patch }] },
    ]);
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Cannot verify/,
    );
    assert.equal(
      calls.some((call) => call.args[1] === "merge"),
      false,
    );
  });
}

for (const [label, pages] of Object.entries({
  "empty response": [],
  "missing check": [{ check_runs: [] }],
  "wrong response shape": {},
  "missing page runs": [{ other: [] }],
  "malformed later page": [{ check_runs: [rateLimitedRun] }, null],
  "duplicate app checks": [
    { check_runs: [rateLimitedRun, { ...rateLimitedRun, id: 2 }] },
  ],
})) {
  test(`rate-limit evidence fails closed for ${label}`, (t) => {
    const { run, calls } = runner(limited, pages);
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Cannot verify/,
    );
    assert.equal(
      calls.some((call) => call.args[1] === "merge"),
      false,
    );
  });
}

for (const [label, checks] of Object.entries({
  "neutral other tool": [
    ...ready.statusCheckRollup,
    { ...quotaCheck, name: "Other" },
  ],
  "CodeRabbit failure": [
    ...ready.statusCheckRollup,
    { ...quotaCheck, conclusion: "FAILURE" },
  ],
  "CodeRabbit pending": [
    ...ready.statusCheckRollup,
    { ...quotaCheck, status: "IN_PROGRESS" },
  ],
  "another CI failed": [
    quotaCheck,
    { ...ready.statusCheckRollup[0], conclusion: "FAILURE" },
  ],
  "another context pending": [
    quotaCheck,
    { __typename: "StatusContext", state: "PENDING" },
  ],
  "only unavailable review": [quotaCheck],
  "duplicate review names": [
    ...ready.statusCheckRollup,
    quotaCheck,
    quotaCheck,
  ],
})) {
  test(`quota never excuses ${label}`, (t) => {
    const { run, calls } = runner({ ...limited, statusCheckRollup: checks });
    assert.throws(
      () => executeSquash({ ...fixture(t), merge: true }, run),
      /Every reported CI/,
    );
    assert.equal(
      calls.some((call) => call.args[0] === "api" || call.args[1] === "merge"),
      false,
    );
  });
}

for (const problem of [
  "authentication failed",
  "request timeout",
  "invalid JSON",
]) {
  test(`quota lookup ${problem} never merges`, (t) => {
    const { run: normal, calls } = runner(limited);
    const run: Runner = (command, args, input) => {
      if (command === "gh" && args[0] === "api") {
        if (problem === "invalid JSON") return "not JSON";
        throw new Error(problem);
      }
      return normal(command, args, input);
    };
    assert.throws(() => executeSquash({ ...fixture(t), merge: true }, run));
    assert.equal(
      calls.some((call) => call.args[1] === "merge"),
      false,
    );
  });
}

test("changes requested still block even when the review service is rate limited", (t) => {
  const { run, calls } = runner({
    ...limited,
    reviewDecision: "CHANGES_REQUESTED",
  });
  assert.throws(
    () => executeSquash({ ...fixture(t), merge: true }, run),
    /PR must be open/,
  );
  assert.equal(
    calls.some((call) => call.args[0] === "api" || call.args[1] === "merge"),
    false,
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

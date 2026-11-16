import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { opaqueId } from "../apps/docs/scripts/e2e-performance.ts";
import {
  parsePublicSample,
  redactInventory,
  sampleIds,
  summarizeSamples,
  checkoutRevisionArguments,
  type PublicSample,
} from "../apps/docs/scripts/e2e-sharding-contract.ts";

const sha = "a".repeat(40);
function fixtures(): PublicSample[] {
  const full = ["first", "second", "third"].map((name) => ({
    id: opaqueId(name),
    file: opaqueId("synthetic.spec.ts"),
    project: "chromium-desktop" as const,
  }));
  return sampleIds.map((id) => {
    const selected = id.endsWith("baseline")
      ? full
      : id.endsWith("1")
        ? full.slice(0, 1)
        : full.slice(1);
    return {
      version: 1,
      id,
      sourceSha: sha,
      runner: opaqueId(id),
      node: "v24.22.1",
      playwright: "1.62.1",
      cpuCount: 4,
      memoryBytes: 16 * 1024 ** 3,
      contract: {
        workers: 2,
        retries: 2,
        timeout: 30000,
        expectTimeout: 5000,
        serverTimeout: 120000,
        fullyParallel: true,
        trace: "on-first-retry",
      },
      full,
      selected,
      attempts: selected.map((entry) => ({
        id: entry.id,
        retry: 0,
        status: entry.id === full[2]!.id ? "skipped" : "passed",
        expectedStatus: "passed",
        durationMs: 100,
        workerIndex: 0,
        failureKind: "none",
      })),
      status: "passed",
      globalErrors: 0,
      commandMs: id.endsWith("baseline") ? 1000 : id.endsWith("1") ? 600 : 400,
      runnerMs: 900,
      eligible: true,
    };
  });
}

test("three independent rounds preserve every case and skip before measuring shard maximum and cost", () => {
  const result = summarizeSamples(fixtures(), sha);
  assert.equal(result.rounds.length, 3);
  for (const round of result.rounds) {
    assert.equal(round.tests, 3);
    assert.equal(round.shardMaxMs, 600);
    assert.equal(round.shardSumMs, 1000);
    assert.equal(round.changePercent, -40);
  }
});

test("failed, missing, duplicate and retried samples are never silently ranked", () => {
  assert.throws(() => summarizeSamples(fixtures().slice(1), sha), /Missing/);
  const duplicate = fixtures();
  duplicate[1] = duplicate[0]!;
  assert.throws(() => summarizeSamples(duplicate, sha), /duplicate/);
  for (const change of [
    (s: PublicSample) => {
      s.eligible = false;
    },
    (s: PublicSample) => {
      s.attempts[0]!.retry = 1;
    },
    (s: PublicSample) => {
      s.attempts[0]!.status = "failed";
    },
    (s: PublicSample) => {
      s.attempts[0]!.status = "skipped";
    },
    (s: PublicSample) => {
      s.globalErrors = 1;
    },
    (s: PublicSample) => {
      s.selected.pop();
    },
  ]) {
    const values = fixtures();
    change(values[1]!);
    assert.throws(() => summarizeSamples(values, sha));
  }
});

test("source, independent runner, resource class and unchanged retry/timeout contract are required", () => {
  assert.deepEqual(checkoutRevisionArguments("/__w/project/project"), [
    "-c",
    "safe.directory=/__w/project/project",
    "rev-parse",
    "HEAD",
  ]);
  for (const invalid of ["relative", "/", "*", "/tmp/*", "/tmp/\nrepo"])
    assert.throws(() => checkoutRevisionArguments(invalid));
  for (const change of [
    (s: PublicSample[]) => {
      s[1]!.runner = s[0]!.runner;
    },
    (s: PublicSample[]) => {
      s[1]!.sourceSha = "b".repeat(40);
    },
    (s: PublicSample[]) => {
      s[1]!.cpuCount = 2;
    },
    (s: PublicSample[]) => {
      s[1]!.memoryBytes = 8 * 1024 ** 3;
    },
    (s: PublicSample[]) => {
      s[1]!.node = "v24.22.2";
    },
  ]) {
    const values = fixtures();
    change(values);
    assert.throws(() => summarizeSamples(values, sha));
  }
  const value = fixtures()[0]!;
  for (const contract of [
    { ...value.contract, workers: 4 },
    { ...value.contract, retries: 0 },
    { ...value.contract, timeout: 60000 },
    { ...value.contract, expectTimeout: 10000 },
  ])
    assert.throws(() => parsePublicSample({ ...value, contract }));
});

test("public summary accepts only allowlisted counters and hashes, never raw diagnostics", () => {
  const value = fixtures()[0]!;
  for (const key of ["stdout", "url", "error", "attachments", "headers"])
    assert.throws(
      () => parsePublicSample({ ...value, [key]: "sensitive-value" }),
      (error: Error) => !error.message.includes("sensitive-value"),
    );
  assert.throws(() =>
    parsePublicSample({
      ...value,
      attempts: [{ ...value.attempts[0], message: "sensitive-value" }],
    }),
  );
  const redacted = redactInventory([
    {
      id: opaqueId("first"),
      file: "/private/sensitive-path",
      project: "chromium-desktop",
    },
  ]);
  assert.ok(!JSON.stringify(redacted).includes("sensitive"));
});

test("experiment workflow pins independent jobs and leaves the existing CI matrix and gates intact", () => {
  const require = createRequire(
    new URL("../apps/docs-backend/package.json", import.meta.url),
  );
  const { parse } = require("yaml") as { parse: (text: string) => any };
  const workflow = parse(
    readFileSync(
      new URL("../.github/workflows/docs-e2e-sharding.yml", import.meta.url),
      "utf8",
    ),
  );
  const existing = parse(
    readFileSync(
      new URL("../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(workflow.jobs.sample.strategy.matrix.id, [...sampleIds]);
  assert.equal(workflow.jobs.sample.strategy["fail-fast"], false);
  assert.equal(workflow.jobs.sample.strategy["max-parallel"], 3);
  assert.equal(workflow.jobs.sample["runs-on"], "ubuntu-latest");
  assert.equal(
    workflow.jobs.sample.container.image,
    existing.jobs["docs-browser"].container.image,
  );
  assert.ok(
    workflow.jobs.sample.if.includes("codex/docs-desktop-e2e-timing-20261115"),
  );
  assert.deepEqual(workflow.permissions, { contents: "read" });
  assert.equal(workflow.on.pull_request_target, undefined);
  assert.equal(workflow.jobs.sample["continue-on-error"], undefined);
  const upload = workflow.jobs.sample.steps.find((step: any) =>
    step.uses?.startsWith("actions/upload-artifact@"),
  );
  assert.equal(upload.with.path, "${{ steps.measure.outputs.summary }}");
  const measure = workflow.jobs.sample.steps.find(
    (step: any) => step.id === "measure",
  );
  assert.ok(measure.run.includes("summary=%s/e2e-public/sample.json"));
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.ok(upload.with.name.includes("${{ github.run_attempt }}"));
  assert.ok(workflow.jobs.compare.if.includes("always()"));
  assert.ok(
    workflow.jobs.compare.steps
      .at(-1)
      .run.includes('test "$SAMPLE_RESULT" = success'),
  );
  assert.equal(existing.jobs["docs-browser"].strategy.matrix.include.length, 5);
  assert.ok(existing.jobs.test.needs.includes("docs-browser"));
});

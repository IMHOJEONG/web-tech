import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import TimingReporter from "../apps/docs/scripts/e2e-timing-reporter.ts";
import {
  apiCategory,
  assertComparable,
  assertInventoryReports,
  assertShardCoverage,
  finalAttempts,
  opaqueId,
  phaseFromTitle,
  record,
  type Inventory,
  type TimingReport,
} from "../apps/docs/scripts/e2e-performance.ts";

const inventory: Inventory[] = ["one", "two", "three"].map((value) => ({
  id: opaqueId(value),
  file: "sample.spec.ts",
  project: "chromium-desktop",
}));
function report(items = inventory): TimingReport {
  return {
    version: 1,
    mode: "run",
    workers: 2,
    shard: null,
    runnerDurationMs: 30,
    status: "passed",
    globalErrors: 0,
    inventory: items,
    attempts: items.map((item) => ({
      id: item.id,
      retry: 0,
      status: "passed",
      expectedStatus: "passed",
      durationMs: 10,
      workerIndex: 0,
      phases: {},
      api: {},
    })),
  };
}

test("timing only retains allowlisted phase and API categories", () => {
  assert.equal(phaseFromTitle("perf:fonts"), "fonts");
  assert.equal(phaseFromTitle("perf:secret-token"), undefined);
  for (const title of [
    'page.goto("https://example.invalid/?token=secret")',
    "page.evaluate(secret)",
    'locator.fill("private input")',
    'apiRequestContext.get("https://example.invalid/private")',
  ])
    assert.ok(
      !apiCategory(title).includes("secret") &&
        !apiCategory(title).includes("private"),
    );
  assert.equal(apiCategory('page.goto("/ko")'), "navigation");
  assert.equal(
    apiCategory('Navigate to "/ko", waiting until "load"'),
    "navigation",
  );
  assert.equal(
    apiCategory('locator.fill("page.screenshot secret.evaluate")'),
    "other",
  );
  assert.equal(apiCategory('GET "/api/private"'), "request");
  assert.equal(opaqueId("private title").length, 64);
});

test("measurements count operations without claiming summed time is wall time", () => {
  const totals = {};
  record(totals, "fonts", 12);
  record(totals, "fonts", 8);
  assert.deepEqual(totals, { fonts: { count: 2, totalMs: 20, maxMs: 12 } });
  for (const duration of [-1, Infinity, NaN])
    assert.throws(() => record(totals, "fonts", duration));
});

test("shards preserve every ID once, including skip candidates", () => {
  const list = { ...report(), mode: "list" as const, attempts: [] };
  assertInventoryReports(list, [list]);
  assert.throws(
    () => assertInventoryReports({ ...list, status: "failed" }, [list]),
    /Invalid/,
  );
  assert.throws(
    () => assertInventoryReports(list, [{ ...list, globalErrors: 1 }]),
    /Invalid/,
  );
  assert.throws(() => assertInventoryReports(list, [report()]), /Invalid/);
  assertShardCoverage(inventory, [inventory.slice(0, 1), inventory.slice(1)]);
  assert.throws(
    () => assertShardCoverage(inventory, [inventory.slice(1)]),
    /Missing/,
  );
  assert.throws(
    () => assertShardCoverage(inventory, [inventory, inventory]),
    /Duplicate/,
  );
  assert.throws(() => assertShardCoverage([], []), /Empty/);
  assert.throws(() => assertShardCoverage(inventory, [[], inventory]), /Empty/);
  assert.throws(
    () =>
      assertShardCoverage(inventory, [[{ ...inventory[0]!, id: "unknown" }]]),
    /Unexpected/,
  );
  assert.throws(
    () =>
      assertShardCoverage(inventory, [
        inventory.map((item) => ({ ...item, project: "other" })),
      ]),
    /identity/,
  );
});

test("comparison rejects hidden retries, failures, missing results and changed skips", () => {
  assertComparable(report(), [
    report(inventory.slice(0, 1)),
    report(inventory.slice(1)),
  ]);
  const skipped = report();
  skipped.attempts[0]!.status = "skipped";
  assert.throws(() => assertComparable(report(), [skipped]), /skip/);
  for (const status of ["failed", "timedOut", "interrupted"]) {
    const failed = report();
    failed.status = status;
    assert.throws(() => finalAttempts(failed), /Unsuccessful/);
  }
  const retried = report();
  retried.attempts[0]!.retry = 1;
  assert.throws(() => finalAttempts(retried), /Retry/);
  const failedAttempt = report();
  failedAttempt.attempts[0]!.status = "failed";
  assert.throws(() => finalAttempts(failedAttempt), /Failed/);
  const duplicate = report();
  duplicate.attempts.push(duplicate.attempts[0]!);
  assert.throws(() => finalAttempts(duplicate), /duplicate/);
  const incomplete = report();
  incomplete.attempts.pop();
  assert.throws(() => finalAttempts(incomplete), /Incomplete/);
  const error = report();
  error.globalErrors = 1;
  assert.throws(() => finalAttempts(error), /Unsuccessful/);
});

test("reporter strips titles, URLs, errors, attachments and stdout from private output", async () => {
  const directory = mkdtempSync(join(tmpdir(), "docs-timing-unit-"));
  const previous = process.env.DOCS_E2E_TIMING_FILE;
  try {
    const file = join(directory, "timing.json");
    process.env.DOCS_E2E_TIMING_FILE = file;
    const reporter = new TimingReporter();
    const sample = {
      id: "private-title-and-token",
      expectedStatus: "passed",
      location: { file: "/synthetic/sample.spec.ts" },
      parent: { project: () => ({ name: "chromium-desktop" }) },
    };
    const result = {
      retry: 0,
      workerIndex: 0,
      duration: 30,
      status: "passed",
      stdout: ["private-token"],
      error: { message: "private-token" },
      attachments: [{ body: "private-response" }],
    };
    reporter.onBegin(
      { rootDir: "/synthetic", workers: 2, shard: null } as never,
      { allTests: () => [sample] } as never,
    );
    reporter.onTestBegin(sample as never, result as never);
    reporter.onStepEnd(
      sample as never,
      result as never,
      { category: "test.step", title: "perf:fonts", duration: 10 } as never,
    );
    reporter.onStepEnd(
      sample as never,
      result as never,
      {
        category: "pw:api",
        title: `page.goto("https://private.invalid?${new URLSearchParams({ token: "private-token" })}")`,
        duration: 5,
      } as never,
    );
    reporter.onTestEnd(sample as never, result as never);
    const failure = {
      ...result,
      status: "failed",
      errors: [{ message: "expect(locator) private-token" }],
    };
    reporter.onTestBegin(sample as never, failure as never);
    reporter.onTestEnd(sample as never, failure as never);
    await reporter.onEnd({ status: "passed", duration: 30 } as never);
    const bytes = readFileSync(file, "utf8");
    assert.ok(!/private|token|stdout|attachments|error\.message/.test(bytes));
    const report = JSON.parse(bytes) as TimingReport;
    assert.equal(report.attempts[0]!.phases.fonts!.totalMs, 10);
    assert.equal(report.attempts[0]!.api.navigation!.totalMs, 5);
    assert.equal(report.attempts[1]!.failureKind, "assertion");
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.deepEqual(
      await reporter.onEnd({ status: "passed", duration: 30 } as never),
      { status: "failed" },
    );
    assert.throws(() => new TimingReporter(), /already exists/);
  } finally {
    if (previous === undefined) delete process.env.DOCS_E2E_TIMING_FILE;
    else process.env.DOCS_E2E_TIMING_FILE = previous;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("timing reporter refuses relative and repository output destinations", () => {
  const previous = process.env.DOCS_E2E_TIMING_FILE;
  try {
    process.env.DOCS_E2E_TIMING_FILE = "relative.json";
    assert.throws(() => new TimingReporter(), /absolute private/);
    process.env.DOCS_E2E_TIMING_FILE = join(process.cwd(), "timing.json");
    assert.throws(() => new TimingReporter(), /outside the repository/);
  } finally {
    if (previous === undefined) delete process.env.DOCS_E2E_TIMING_FILE;
    else process.env.DOCS_E2E_TIMING_FILE = previous;
  }
});

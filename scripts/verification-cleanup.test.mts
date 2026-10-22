import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { finishVerification } from "./verification-cleanup.mts";

const steps = [
  "browserClosed",
  "backendStopped",
  "frontendStopped",
  "databaseDisconnected",
  "databaseRemoved",
  "temporaryFilesRemoved",
] as const;
type Step = (typeof steps)[number];

/** Injects cleanup failures without touching real processes, Docker, or credentials. */
function fixture(failures: readonly Step[] = [], asynchronous = false) {
  const calls: string[] = [];
  const actions = Object.fromEntries(
    steps.map((step) => [
      step,
      () => {
        calls.push(step);
        if (!failures.includes(step)) return;
        const error = new Error(`${step}: fixture-secret`);
        if (asynchronous) return Promise.reject(error);
        throw error;
      },
    ]),
  ) as Record<Step, () => void | Promise<never>>;
  return {
    calls,
    actions,
    redact: (value: string) => value.replaceAll("fixture-secret", "[redacted]"),
  };
}

test("successful cleanup reports after every step without inventing a failure", async () => {
  const current = fixture();
  const result = await finishVerification({
    ...current,
    report: async (report) => {
      assert.deepEqual(current.calls, steps);
      assert.ok(Object.values(report.cleanup).every(Boolean));
      current.calls.push("report");
    },
  });
  assert.deepEqual(current.calls, [...steps, "report"]);
  assert.deepEqual(result.cleanupErrors, []);
  assert.equal(result.error, undefined);
  assert.equal(result.failed, false);
});

for (const failedStep of steps) {
  test(`${failedStep} failure still attempts later cleanup and writes evidence`, async () => {
    const current = fixture([failedStep]);
    const temp = await mkdtemp(join(tmpdir(), "verification-cleanup-test-"));
    const evidence = join(temp, "evidence.json");
    try {
      const result = await finishVerification({
        ...current,
        fatal: "original assertion: fixture-secret",
        report: async (report) => {
          assert.deepEqual(current.calls, steps);
          await writeFile(evidence, JSON.stringify(report), { flag: "wx" });
          current.calls.push("report");
        },
      });
      const raw = await readFile(evidence, "utf8");
      const saved = JSON.parse(raw);
      assert.deepEqual(current.calls, [...steps, "report"]);
      assert.equal(result.failed, true);
      assert.equal(saved.error, "original assertion: [redacted]");
      assert.deepEqual(saved.cleanupErrors, [
        { step: failedStep, message: `${failedStep}: [redacted]` },
      ]);
      assert.deepEqual(
        saved.cleanup,
        Object.fromEntries(steps.map((step) => [step, step !== failedStep])),
      );
      assert.ok(!raw.includes("fixture-secret"));
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
}

test("async cleanup rejections are collected independently of the original failure", async () => {
  const current = fixture(steps, true);
  const result = await finishVerification({
    ...current,
    fatal: "original failure",
    report: async (report) => {
      assert.equal(report.cleanupErrors.length, steps.length);
      current.calls.push("report");
    },
  });
  assert.deepEqual(current.calls, [...steps, "report"]);
  assert.ok(Object.values(result.cleanup).every((value) => !value));
  assert.equal(result.error, "original failure");
  assert.equal(result.failed, true);
});

test("cleanup failure alone fails verification without replacing the main outcome", async () => {
  const current = fixture(["backendStopped"]);
  const result = await finishVerification({
    ...current,
    report: async () => {},
  });
  assert.equal(result.failed, true);
  assert.equal(result.error, undefined);
  assert.equal(result.cleanup.backendStopped, false);
  assert.equal(result.cleanup.temporaryFilesRemoved, true);
});

test("an original failure stays failed even when every cleanup succeeds", async () => {
  const result = await finishVerification({
    ...fixture(),
    fatal: "assertion failed",
    report: async () => {},
  });
  assert.equal(result.failed, true);
  assert.equal(result.error, "assertion failed");
  assert.deepEqual(result.cleanupErrors, []);
});

test("report-write failure is redacted without losing cleanup or original errors", async () => {
  const current = fixture(["databaseRemoved"]);
  const result = await finishVerification({
    ...current,
    fatal: "assertion failed",
    report: async () => {
      throw new Error("disk failure: fixture-secret");
    },
  });
  assert.deepEqual(current.calls, steps);
  assert.equal(result.reportError, "disk failure: [redacted]");
  assert.equal(result.error, "assertion failed");
  assert.equal(result.cleanupErrors.length, 1);
  assert.equal(result.failed, true);
});

test("non-Error throws are collected and report-only failure is unsuccessful", async () => {
  const current = fixture();
  current.actions.browserClosed = () => {
    current.calls.push("browserClosed");
    throw "fixture-secret";
  };
  const result = await finishVerification({
    ...current,
    report: async () => {
      throw "fixture-secret";
    },
  });
  assert.deepEqual(current.calls, steps);
  assert.deepEqual(result.cleanupErrors, [
    { step: "browserClosed", message: "[redacted]" },
  ]);
  assert.equal(result.reportError, "[redacted]");
  assert.equal(result.failed, true);
});

test("report failure alone cannot silently pass a successful run", async () => {
  const result = await finishVerification({
    ...fixture(),
    report: async () => {
      throw new Error("disk full");
    },
  });
  assert.ok(Object.values(result.cleanup).every(Boolean));
  assert.deepEqual(result.cleanupErrors, []);
  assert.equal(result.error, undefined);
  assert.equal(result.reportError, "disk full");
  assert.equal(result.failed, true);
});

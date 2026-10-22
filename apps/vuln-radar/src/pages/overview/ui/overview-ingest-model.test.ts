import assert from "node:assert/strict";
import test from "node:test";
import type { IngestStatusResponse } from "@/shared/api/radar";
import {
  ingestObservationSchema,
  ingestSchedulerSchema,
} from "../../../shared/api/ingest-status.ts";
import {
  buildIngestDisplay,
  formatStoredSourceDate,
  OVERVIEW_REFRESH_INTERVAL_MS,
} from "./overview-ingest-model.ts";
import { formatRelativeTime } from "./overview-view-model.ts";

const now = Date.parse("2026-10-22T12:00:00Z");
const success = "2026-10-22T03:00:00Z";
function status(): IngestStatusResponse {
  return {
    checkedAt: "2026-10-22T12:00:00Z",
    storage: "database",
    mode: "pull",
    note: "Synthetic",
    sources: [],
    latest: {
      databaseUpdatedAt: success,
      upstreamLastModifiedAt: "2026-01-01T00:00:00Z",
      kevCatalogAddedAt: null,
      epssObservedAt: null,
    },
    counts: {
      vulnerabilities: 1,
      p0: 0,
      p1: 0,
      kevAdvisories: 0,
      enabledWatchlistEntries: 0,
    },
  };
}
function observed(): IngestStatusResponse {
  return {
    ...status(),
    scheduler: { enabled: true, intervalMinutes: 1440 },
    observation: {
      scope: "process",
      observedSince: "2026-10-22T00:00:00Z",
      outcome: "completed",
      lastStartedAt: success,
      lastFinishedAt: success,
      lastSuccessAt: success,
      sources: [],
    },
  };
}

test("screen polling is independent of collection cadence", () => {
  assert.equal(OVERVIEW_REFRESH_INTERVAL_MS, 60_000);
  assert.equal(observed().scheduler?.intervalMinutes, 1440);
});

test("older backend timestamps never become a successful collection", () => {
  const model = buildIngestDisplay(status(), now);
  assert.equal(model.state, "unknown");
  assert.equal(model.lastSuccessAt, null);
  assert.ok(
    model.sources.every(
      (source) =>
        source.outcome === "unknown" && source.lastFetchSuccessAt === null,
    ),
  );
});

test("an old upstream date and a nine-hour-old success are not failure under a daily schedule", () => {
  assert.equal(buildIngestDisplay(observed(), now).state, "completed");
  assert.equal(buildIngestDisplay(observed()).state, "completed");
});

test("missing run history after restart stays unknown even when the database contains recent records", () => {
  const value = observed();
  value.observation = {
    ...value.observation!,
    outcome: "unknown",
    lastSuccessAt: null,
  };
  assert.equal(buildIngestDisplay(value, now).state, "unknown");
  assert.equal(buildIngestDisplay(value, now).lastSuccessAt, null);
});

test("overdue success is a review hint, never a fabricated source failure", () => {
  const value = observed();
  value.scheduler!.intervalMinutes = 60;
  const model = buildIngestDisplay(value, now);
  assert.equal(model.state, "review");
  assert.ok(model.sources.every((source) => source.outcome === "unknown"));
  value.scheduler!.enabled = false;
  assert.equal(buildIngestDisplay(value, now).state, "completed");
});

test("running, partial and failed observations are not overridden by age", () => {
  for (const outcome of ["running", "partial", "failed"] as const) {
    const value = observed();
    value.scheduler!.intervalMinutes = 1;
    value.observation!.outcome = outcome;
    assert.equal(buildIngestDisplay(value, now).state, outcome);
  }
});

test("source fetch success and stored upstream dates remain distinct", () => {
  const value = observed();
  value.observation!.sources = [
    {
      id: "nvd",
      outcome: "failed",
      lastAttemptAt: success,
      lastFetchSuccessAt: "2026-10-22T01:00:00Z",
      lastFailureAt: success,
      consecutiveFailures: 2,
    },
  ];
  const source = buildIngestDisplay(value, now).sources[0]!;
  assert.equal(source.lastFetchSuccessAt, "2026-10-22T01:00:00Z");
  assert.equal(source.dataUpdatedAt, "2026-01-01T00:00:00Z");
  assert.equal(source.consecutiveFailures, 2);
  assert.equal(source.outcome, "failed");
});

test("new observation schemas remain optional for older API payloads and reject invalid cadence", () => {
  assert.equal(ingestObservationSchema.optional().parse(undefined), undefined);
  assert.equal(ingestSchedulerSchema.optional().parse(undefined), undefined);
  assert.equal(
    ingestSchedulerSchema.parse({ enabled: false, intervalMinutes: 60 })
      .enabled,
    false,
  );
  assert.equal(
    ingestSchedulerSchema.parse({ enabled: true, intervalMinutes: 1.5 })
      .intervalMinutes,
    1.5,
  );
  assert.equal(
    ingestSchedulerSchema.safeParse({ enabled: true, intervalMinutes: 0 })
      .success,
    false,
  );
  assert.equal(
    ingestObservationSchema.safeParse(observed().observation).success,
    true,
  );
});

test("relative times follow locale and reject missing, invalid or future dates", () => {
  assert.equal(formatRelativeTime(success, "ko", now), "9시간 전");
  assert.equal(formatRelativeTime(success, "en", now), "9 hours ago");
  for (const value of [null, "bad-date", "2099-01-01T00:00:00Z"]) {
    assert.equal(formatRelativeTime(value, "ko", now), "—");
  }
});

test("KEV and EPSS dates do not acquire a fabricated fetch time or shift calendar dates", () => {
  assert.equal(
    formatStoredSourceDate("2026-10-22T00:00:00Z", "kev", "en-US"),
    "Oct 22, 2026",
  );
  assert.equal(
    formatStoredSourceDate("2026-10-22T00:00:00Z", "epss", "en-US"),
    "Oct 22, 2026",
  );
  assert.equal(formatStoredSourceDate(null, "nvd", "ko"), null);
  assert.equal(formatStoredSourceDate("invalid", "epss", "ko"), null);
});

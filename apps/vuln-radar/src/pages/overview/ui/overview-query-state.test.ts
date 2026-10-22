import assert from "node:assert/strict";
import test from "node:test";
import {
  getOverviewQueryState,
  isOverviewUnavailable,
  type OverviewQuerySnapshot,
} from "./overview-query-state.ts";
import {
  formatLargeMetric,
  getTrackedCount,
  getCriticalCount,
} from "./overview-view-model.ts";

const query = (
  changes: Partial<OverviewQuerySnapshot<unknown>> = {},
): OverviewQuerySnapshot<unknown> => ({
  data: undefined,
  error: null,
  isFetching: false,
  dataUpdatedAt: 0,
  ...changes,
});

test("cold pending and offline-paused queries remain panel-local pending", () => {
  assert.equal(getOverviewQueryState(query({ isFetching: true })), "pending");
  assert.equal(getOverviewQueryState(query()), "pending");
});

test("cold HTTP, network and schema errors do not fabricate successful empty data", () => {
  for (const code of ["http", "network", "parse"]) {
    assert.equal(
      getOverviewQueryState(query({ error: { code } })),
      "unavailable",
    );
    assert.equal(
      getOverviewQueryState(query({ error: { code }, isFetching: true })),
      "unavailable",
    );
  }
  assert.equal(
    getOverviewQueryState(query({ errorUpdatedAt: 10, isFetching: true })),
    "unavailable",
  );
});

test("cached zero and empty collections are valid even after a failed refetch", () => {
  for (const data of [0, [], { entries: [] }]) {
    assert.equal(getOverviewQueryState(query({ data })), "ready");
    assert.equal(
      getOverviewQueryState(
        query({
          data,
          error: Error("503"),
          isFetching: true,
          dataUpdatedAt: 10,
        }),
      ),
      "stale",
    );
  }
});

test("a successful refetch clears stale state without changing data ownership", () => {
  const data = { cards: [{ id: "p0-open", value: 12 }] };
  assert.equal(
    getOverviewQueryState(query({ data, error: Error("503") })),
    "stale",
  );
  assert.equal(
    getOverviewQueryState(query({ data, dataUpdatedAt: 20 })),
    "ready",
  );
});

test("whole-page error requires every query to finish without any cached data", () => {
  const failed = query({ error: Error("503") });
  assert.equal(isOverviewUnavailable([]), false);
  assert.equal(isOverviewUnavailable([failed, failed]), true);
  assert.equal(
    isOverviewUnavailable([failed, query({ isFetching: true })]),
    false,
  );
  assert.equal(isOverviewUnavailable([failed, query({ data: [] })]), false);
  assert.equal(
    isOverviewUnavailable([failed, query({ errorUpdatedAt: 10 })]),
    false,
  );
  assert.equal(
    isOverviewUnavailable([
      failed,
      query({ error: Error("503"), isFetching: true }),
    ]),
    false,
  );
  assert.equal(
    isOverviewUnavailable([failed, query({ data: [], error: Error("503") })]),
    false,
  );
});

test("missing aggregate metrics without ingest status remain unknown, not zero or feed length", () => {
  assert.equal(getTrackedCount(undefined, []), undefined);
  assert.equal(getCriticalCount(undefined, []), undefined);
  assert.equal(formatLargeMetric(undefined), "—");
  assert.equal(formatLargeMetric(0), "0");
});

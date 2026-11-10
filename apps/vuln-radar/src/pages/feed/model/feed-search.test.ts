import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFeedSearch, searchWithFilters } from "./feed-search.ts";
import { feedSearchPath } from "../../../shared/api/feed-search.ts";

test("restores all URL filters and page after direct load/back navigation", () => {
  const search = parseFeedSearch({
    q: "needle",
    priority: "P1",
    severity: "high",
    kev: "kev",
    page: "3",
  });
  assert.equal(search.page, 3);
  const params = new URLSearchParams(feedSearchPath(search).split("?")[1]);
  assert.equal(params.get("q"), "needle");
  assert.equal(params.get("priority"), "P1");
  assert.equal(params.get("severity"), "high");
  assert.equal(params.get("kev"), "kev");
  assert.equal(params.get("page"), "3");
});
test("filter changes always reset page one", () => {
  assert.equal(
    searchWithFilters({
      query: "new",
      priority: "P0",
      severity: "all",
      kev: "all",
    }).page,
    1,
  );
});
test("normalizes malformed URL state without unsafe values", () => {
  for (const page of ["-1", "1.5", "10001", "Infinity", {}, ["2"]]) {
    assert.equal(parseFeedSearch({ page }).page, 1);
  }
  assert.equal(parseFeedSearch({ q: "x".repeat(130) }).q.length, 120);
  assert.equal(parseFeedSearch({ priority: "invalid" }).priority, "all");
});
test("encodes search metacharacters and query parameters", () => {
  const path = feedSearchPath(parseFeedSearch({ q: "a&priority=P0 %_" }));
  const params = new URLSearchParams(path.split("?")[1]);
  assert.equal(params.get("q"), "a&priority=P0 %_");
  assert.equal(params.get("priority"), "all");
});

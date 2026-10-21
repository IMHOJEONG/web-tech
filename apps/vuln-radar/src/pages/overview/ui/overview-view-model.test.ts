import assert from "node:assert/strict";
import test from "node:test";
import type { IngestStatusResponse } from "@/shared/api/radar";
import {
  getCriticalCount,
  getP1Count,
  getTrackedCount,
  getKevCount,
} from "./overview-view-model.ts";

const status = {
  counts: {
    vulnerabilities: 99,
    p0: 90,
    p1: 8,
    kevAdvisories: 400,
    enabledWatchlistEntries: 1,
  },
} as IngestStatusResponse;
const cards = [
  { id: "p0-open", value: 32 },
  { id: "p1-open", value: 11 },
  { id: "kev-new", value: 39 },
  { id: "total-vulnerabilities", value: 49 },
];

test("overview metrics all prefer the same full-database aggregate response", () => {
  assert.equal(getTrackedCount(status, cards), 49);
  assert.equal(getCriticalCount(status, cards), 32);
  assert.equal(getP1Count(status, cards), 11);
  assert.equal(getKevCount(cards), 39);
});

test("zero aggregates remain zero even when the separately polled ingest status differs", () => {
  const zeros = cards.map((card) => ({ ...card, value: 0 }));
  assert.equal(getTrackedCount(status, zeros), 0);
  assert.equal(getCriticalCount(status, zeros), 0);
  assert.equal(getP1Count(status, zeros), 0);
  assert.equal(getKevCount(zeros), 0);
});

test("older backend total count falls back to full ingest count, never feed length", () => {
  assert.equal(getTrackedCount(status, cards.slice(0, 3)), 99);
});

test("missing KEV metrics do not substitute a count of advisory records", () => {
  assert.equal(getKevCount([]), undefined);
});

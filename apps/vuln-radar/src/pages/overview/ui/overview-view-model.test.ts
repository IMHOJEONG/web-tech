import assert from "node:assert/strict";
import test from "node:test";
import type { IngestStatusResponse, KevResponse } from "@/shared/api/radar";
import {
  getCriticalCount,
  getP1Count,
  getTrackedCount,
  getKevCount,
  buildKevMatrixItems,
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

const kev = (items: KevResponse["items"]): KevResponse => ({
  generatedAt: "2026-10-21T00:00:00Z",
  dataSource: {
    kind: "database",
    reason: "live_read_model",
    message: "Synthetic fixture",
  },
  items,
});
const kevItem = (
  cveId: string,
  epssScore?: number | null,
): KevResponse["items"][number] => ({
  cveId,
  title: "Synthetic KEV",
  priority: "P1",
  sourceUrl: null,
  addedAt: "2026-10-21T00:00:00Z",
  epssScore,
});

test("KEV scores preserve actual zero, null and small values without feed or default scores", () => {
  assert.deepEqual(
    buildKevMatrixItems(
      kev([
        kevItem("CVE-2097-1", 0),
        kevItem("CVE-2097-2", null),
        kevItem("CVE-2097-3", 0.000001),
      ]),
    ).map((item) => item.epssScore),
    [0, null, 0.000001],
  );
});

test("older KEV responses without EPSS stay unknown rather than becoming 0.5", () => {
  const rows = buildKevMatrixItems(kev([kevItem("CVE-2097-1")]));
  assert.equal(rows[0]?.epssScore, null);
});

test("an empty or unavailable KEV response never falls back to unrelated feed items", () => {
  assert.deepEqual(buildKevMatrixItems(kev([])), []);
  assert.deepEqual(buildKevMatrixItems(), []);
});

test("KEV rows preserve priority without manufacturing severity or response status", () => {
  const row = buildKevMatrixItems(kev([kevItem("CVE-2097-1", 0.3)]))[0];
  assert.equal(row?.priority, "P1");
  assert.equal(Object.hasOwn(row!, "statusLabel"), false);
  assert.equal(Object.hasOwn(row!, "severity"), false);
});

test("multiple advisories for one CVE produce one row and keep six distinct entries", () => {
  const item = kevItem("CVE-2097-1", 0.8);
  const rows = buildKevMatrixItems(
    kev([
      item,
      item,
      ...Array.from({ length: 8 }, (_, i) => kevItem(`CVE-2097-${i + 2}`, 0)),
    ]),
  );
  assert.equal(rows.length, 6);
  assert.equal(new Set(rows.map((row) => row.cveId)).size, 6);
  assert.equal(rows[0]?.epssScore, 0.8);
});

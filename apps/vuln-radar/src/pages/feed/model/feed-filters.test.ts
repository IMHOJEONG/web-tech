import assert from "node:assert/strict";
import test from "node:test";
import type { FeedItem } from "./feed-filters.ts";
import {
  DEFAULT_FEED_FILTERS,
  filterFeedItems,
  summarizeFeedItems,
} from "./feed-filters.ts";

const items = [
  createItem({
    cveId: "CVE-2026-0001",
    title: "React server component boundary issue",
    priority: "P0",
    severity: "critical",
    isKev: true,
    updatedAt: "2026-08-30T01:00:00.000Z",
    matchedWatchlist: ["react", "next"],
  }),
  createItem({
    cveId: "CVE-2026-0002",
    title: "OpenSSL retry timeout handling",
    priority: "P1",
    severity: "high",
    updatedAt: "2026-08-30T03:00:00.000Z",
    matchedWatchlist: ["openssl"],
  }),
  createItem({
    cveId: "CVE-2026-0003",
    title: "Low impact package advisory",
    priority: "P3",
    severity: "low",
    updatedAt: "2026-08-29T03:00:00.000Z",
  }),
];

test("filterFeedItems sorts latest updated vulnerabilities first", () => {
  const filtered = filterFeedItems(items, DEFAULT_FEED_FILTERS);

  assert.deepEqual(
    filtered.map((item) => item.cveId),
    ["CVE-2026-0002", "CVE-2026-0001", "CVE-2026-0003"],
  );
});

test("filterFeedItems applies priority severity kev and query filters", () => {
  const filtered = filterFeedItems(items, {
    query: "react",
    priority: "P0",
    severity: "critical",
    kev: "kev",
  });

  assert.deepEqual(
    filtered.map((item) => item.cveId),
    ["CVE-2026-0001"],
  );
});

test("filterFeedItems searches cve id title and watchlist terms", () => {
  assert.equal(
    filterFeedItems(items, {
      ...DEFAULT_FEED_FILTERS,
      query: "openssl",
    })[0]?.cveId,
    "CVE-2026-0002",
  );

  assert.equal(
    filterFeedItems(items, {
      ...DEFAULT_FEED_FILTERS,
      query: "0003",
    })[0]?.cveId,
    "CVE-2026-0003",
  );
});

test("summarizeFeedItems returns operational feed counters", () => {
  assert.deepEqual(summarizeFeedItems(items), {
    total: 3,
    p0: 1,
    kev: 1,
    watchlistMatches: 3,
  });
});

function createItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    cveId: "CVE-2026-0000",
    title: "Mock vulnerability",
    priority: "P2",
    severity: "medium",
    epssScore: 0.25,
    isKev: false,
    publishedAt: "2026-08-30T00:00:00.000Z",
    updatedAt: "2026-08-30T00:00:00.000Z",
    matchedWatchlist: [],
    reliability: {
      level: "medium",
      confidenceScore: 68,
      freshness: {
        status: "fresh",
        ingestedAt: "2026-08-30T00:00:00.000Z",
        upstreamModifiedAt: "2026-08-30T00:00:00.000Z",
        verifiedAt: "2026-08-30T00:00:00.000Z",
      },
      evidenceCompleteness: {
        score: 72,
        missing: ["affected", "mitigation"],
      },
      conflicts: [],
    },
    ...overrides,
  };
}

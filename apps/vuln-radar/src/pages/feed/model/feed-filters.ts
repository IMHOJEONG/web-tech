import type { FeedResponse } from "@/shared/api/radar";

export type FeedItem = FeedResponse["items"][number];
export type FeedPriorityFilter = "all" | FeedItem["priority"];
export type FeedSeverityFilter = "all" | FeedItem["severity"];
export type FeedKevFilter = "all" | "kev";

export interface FeedFilters {
  query: string;
  priority: FeedPriorityFilter;
  severity: FeedSeverityFilter;
  kev: FeedKevFilter;
}

export const DEFAULT_FEED_FILTERS: FeedFilters = {
  query: "",
  priority: "all",
  severity: "all",
  kev: "all",
};

export function filterFeedItems(items: FeedItem[], filters: FeedFilters) {
  const normalizedQuery = normalizeQuery(filters.query);

  return items
    .filter((item) => {
      if (filters.priority !== "all" && item.priority !== filters.priority) {
        return false;
      }

      if (filters.severity !== "all" && item.severity !== filters.severity) {
        return false;
      }

      if (filters.kev === "kev" && !item.isKev) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return buildSearchText(item).includes(normalizedQuery);
    })
    .sort((left, right) => {
      return (
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      );
    });
}

export function summarizeFeedItems(items: FeedItem[]) {
  return {
    total: items.length,
    p0: items.filter((item) => item.priority === "P0").length,
    kev: items.filter((item) => item.isKev).length,
    watchlistMatches: items.reduce(
      (sum, item) => sum + item.matchedWatchlist.length,
      0,
    ),
  };
}

export function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function buildSearchText(item: FeedItem) {
  return [
    item.cveId,
    item.title,
    item.priority,
    item.severity,
    item.isKev ? "kev" : "",
    item.reliability.level,
    item.reliability.freshness.status,
    ...item.reliability.evidenceCompleteness.missing,
    ...item.reliability.conflicts.map((conflict) => conflict.message),
    ...item.matchedWatchlist,
  ]
    .join(" ")
    .toLowerCase();
}

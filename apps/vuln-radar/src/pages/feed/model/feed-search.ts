import type { FeedFilters } from "./feed-filters";
import type { FeedSearch } from "../../../shared/api/feed-search";

export function parseFeedSearch(raw: Record<string, unknown>): FeedSearch {
  const page =
    typeof raw.page === "number"
      ? raw.page
      : typeof raw.page === "string" && /^[1-9]\d*$/.test(raw.page)
        ? Number(raw.page)
        : 1;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 120) : "",
    priority: ["P0", "P1", "P2", "P3"].includes(String(raw.priority))
      ? (raw.priority as FeedSearch["priority"])
      : "all",
    severity: ["critical", "high", "medium", "low"].includes(
      String(raw.severity),
    )
      ? (raw.severity as FeedSearch["severity"])
      : "all",
    kev: raw.kev === "kev" ? "kev" : "all",
    page: Number.isInteger(page) && page >= 1 && page <= 10000 ? page : 1,
  };
}

export function searchWithFilters(filters: FeedFilters): FeedSearch {
  return parseFeedSearch({ ...filters, q: filters.query, page: 1 });
}

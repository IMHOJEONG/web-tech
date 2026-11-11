export interface FeedSearch {
  q: string;
  priority: "all" | "P0" | "P1" | "P2" | "P3";
  severity: "all" | "critical" | "high" | "medium" | "low";
  kev: "all" | "kev";
  page: number;
}

export function feedSearchPath(search: FeedSearch) {
  return (
    "feed/search?" +
    new URLSearchParams({
      q: search.q.trim(),
      priority: search.priority,
      severity: search.severity,
      kev: search.kev,
      page: String(search.page),
      pageSize: "25",
    }).toString()
  );
}

import type {
  FeedResponse,
  IngestStatusResponse,
  KevResponse,
} from "@/shared/api/radar";

export interface OverviewMatrixItem {
  cveId: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  severity: "critical" | "high" | "medium" | "low";
  score: number;
  statusLabel: string;
}

export function buildKevMatrixItems(feed: FeedResponse, kev: KevResponse) {
  const feedByCveId = new Map(feed.items.map((item) => [item.cveId, item]));
  const kevRows = kev.items.slice(0, 6).map((item) => {
    const feedItem = feedByCveId.get(item.cveId);

    return {
      cveId: item.cveId,
      title: item.title,
      priority: item.priority,
      severity: feedItem?.severity ?? "high",
      score: feedItem?.epssScore ?? 0.5,
      statusLabel: getStatusLabel(item.priority),
    } satisfies OverviewMatrixItem;
  });

  if (kevRows.length > 0) {
    return kevRows;
  }

  return feed.items.slice(0, 6).map((item) => ({
    cveId: item.cveId,
    title: item.title,
    priority: item.priority,
    severity: item.severity,
    score: item.epssScore,
    statusLabel: getStatusLabel(item.priority),
  }));
}

export function getCriticalCount(
  status: IngestStatusResponse,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "p0-open")?.value ??
    status.counts.p0
  );
}

export function getP1Count(
  status: IngestStatusResponse,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "p1-open")?.value ??
    status.counts.p1
  );
}

export function getTrackedDelta(
  status: IngestStatusResponse,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "kev-new")?.value ??
    status.counts.kevAdvisories
  );
}

export function formatDataSourceLabel(source: {
  kind: "database" | "mock";
  reason:
    | "live_read_model"
    | "derived_from_feed"
    | "database_unavailable"
    | "no_database_rows";
}) {
  if (source.kind === "mock") {
    return "Mock fallback";
  }

  if (source.reason === "derived_from_feed") {
    return "Derived";
  }

  return "Database";
}

export function formatLargeMetric(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const timestamp = new Date(value).getTime();
  const deltaMinutes = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 60_000),
  );

  if (deltaMinutes < 1) {
    return "Just now";
  }

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  return `${Math.round(deltaHours / 24)}d ago`;
}

function getStatusLabel(priority: "P0" | "P1" | "P2" | "P3") {
  switch (priority) {
    case "P0":
      return "Escalated";
    case "P1":
      return "Investigating";
    case "P2":
      return "Monitoring";
    case "P3":
      return "Queued";
    default:
      return priority;
  }
}

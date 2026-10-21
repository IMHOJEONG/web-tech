import type { IngestStatusResponse, KevResponse } from "@/shared/api/radar";

export interface OverviewMatrixItem {
  cveId: string;
  title: string;
  priority: "P0" | "P1" | "P2" | "P3";
  epssScore: number | null;
}

export function buildKevMatrixItems(kev?: KevResponse): OverviewMatrixItem[] {
  const rows = new Map<string, OverviewMatrixItem>();
  for (const item of kev?.items ?? []) {
    if (rows.has(item.cveId)) continue;
    rows.set(item.cveId, {
      cveId: item.cveId,
      title: item.title,
      priority: item.priority,
      epssScore: item.epssScore ?? null,
    });
    if (rows.size === 6) break;
  }
  return [...rows.values()];
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

export function getTrackedCount(
  status: IngestStatusResponse,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "total-vulnerabilities")?.value ??
    status.counts.vulnerabilities
  );
}

export function getKevCount(overviewCards: { id: string; value: number }[]) {
  return overviewCards.find((card) => card.id === "kev-new")?.value;
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

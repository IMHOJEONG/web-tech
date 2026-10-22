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
  status: IngestStatusResponse | undefined,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "p0-open")?.value ??
    status?.counts.p0
  );
}

export function getP1Count(
  status: IngestStatusResponse | undefined,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "p1-open")?.value ??
    status?.counts.p1
  );
}

export function getTrackedCount(
  status: IngestStatusResponse | undefined,
  overviewCards: { id: string; value: number }[],
) {
  return (
    overviewCards.find((card) => card.id === "total-vulnerabilities")?.value ??
    status?.counts.vulnerabilities
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

export function formatLargeMetric(value: number | undefined) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatRelativeTime(
  value: string | null,
  locale = "en",
  now = Date.now(),
) {
  const elapsed = value ? now - Date.parse(value) : NaN;
  if (!Number.isFinite(elapsed) || elapsed < 0) return "—";
  if (elapsed < 60_000) return locale === "ko" ? "방금" : "Just now";
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (elapsed < 3_600_000)
    return relative.format(-Math.floor(elapsed / 60_000), "minute");
  if (elapsed < 86_400_000)
    return relative.format(-Math.floor(elapsed / 3_600_000), "hour");
  return relative.format(-Math.floor(elapsed / 86_400_000), "day");
}

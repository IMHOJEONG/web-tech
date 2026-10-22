import type { IngestStatusResponse } from "@/shared/api/radar";

export const OVERVIEW_REFRESH_INTERVAL_MS = 60_000;

export function formatStoredSourceDate(
  value: string | null,
  id: "nvd" | "kev" | "epss",
  locale: string,
) {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    ...(id === "nvd" ? { timeStyle: "short" as const } : { timeZone: "UTC" }),
  }).format(new Date(value));
}
export type IngestDisplayState =
  | "unknown"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "review";

export function buildIngestDisplay(
  status: IngestStatusResponse,
  now = Date.parse(status.checkedAt),
) {
  const observation = status.observation;
  let state: IngestDisplayState = observation?.outcome ?? "unknown";
  const lastSuccessAt = observation?.lastSuccessAt ?? null;
  const lastSuccess = lastSuccessAt ? Date.parse(lastSuccessAt) : NaN;
  // This is a review threshold, not proof that the collector or upstream failed.
  if (
    state === "completed" &&
    status.scheduler?.enabled &&
    Number.isFinite(lastSuccess) &&
    now - lastSuccess > status.scheduler.intervalMinutes * 60_000 * 2
  ) {
    state = "review";
  }
  const updated = {
    nvd: status.latest.upstreamLastModifiedAt,
    kev: status.latest.kevCatalogAddedAt,
    epss: status.latest.epssObservedAt,
  };
  return {
    state,
    lastSuccessAt,
    sources: (["nvd", "kev", "epss"] as const).map((id) => {
      const source = observation?.sources.find((source) => source.id === id);
      return {
        id,
        outcome: source?.outcome ?? "unknown",
        lastFetchSuccessAt: source?.lastFetchSuccessAt ?? null,
        lastFailureAt: source?.lastFailureAt ?? null,
        consecutiveFailures: source?.consecutiveFailures ?? null,
        dataUpdatedAt: updated[id],
      };
    }),
  };
}

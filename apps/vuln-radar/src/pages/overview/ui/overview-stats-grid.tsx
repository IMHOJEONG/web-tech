import type { OverviewResponse, WatchlistResponse } from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  formatLargeMetric,
  getP1Count,
  getTrackedCount,
  getKevCount,
} from "./overview-view-model";

function OverviewStatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number | undefined;
  description: string;
}) {
  return (
    <article className="rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur">
      <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-radar-copy/72">
        {title}
      </h2>
      <strong className="mt-2 block font-mono text-[2.2rem] leading-none text-white">
        {formatLargeMetric(value)}
      </strong>
      <p className="mt-2 text-sm leading-6 text-radar-copy/72">{description}</p>
    </article>
  );
}

export function OverviewTotalsCard({
  overview,
}: {
  overview: OverviewResponse;
}) {
  const { t } = useI18n();
  return (
    <OverviewStatCard
      title={t("overview.totalVulnerabilities")}
      value={getTrackedCount(undefined, overview.cards)}
      description={t("overview.statTrackedDelta", {
        count: getKevCount(overview.cards) ?? "—",
        p1: getP1Count(undefined, overview.cards) ?? "—",
      })}
    />
  );
}

export function OverviewWatchlistCard({
  watchlist,
}: {
  watchlist: WatchlistResponse;
}) {
  const { t } = useI18n();
  return (
    <OverviewStatCard
      title={t("overview.watchlistMatches")}
      value={watchlist.entries.reduce(
        (total, entry) => total + entry.matchCount,
        0,
      )}
      description={t("overview.watchlistActive", {
        count: watchlist.entries.length,
      })}
    />
  );
}

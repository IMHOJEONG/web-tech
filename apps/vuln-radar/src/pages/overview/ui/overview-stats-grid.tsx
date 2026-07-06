import type {
  IngestStatusResponse,
  OverviewResponse,
  WatchlistResponse,
} from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  formatLargeMetric,
  formatRelativeTime,
  getP1Count,
  getTrackedDelta,
} from "./overview-view-model";

interface OverviewStatsGridProps {
  latestAppliedAt: string;
  overview: OverviewResponse;
  status: IngestStatusResponse;
  watchlist: WatchlistResponse;
}

export function OverviewStatsGrid({
  latestAppliedAt,
  overview,
  status,
  watchlist,
}: OverviewStatsGridProps) {
  const { t } = useI18n();
  const trackedCount = status.counts.vulnerabilities;
  const trackedDelta = getTrackedDelta(status, overview.cards);
  const p1Count = getP1Count(status, overview.cards);
  const totalWatchMatches = watchlist.entries.reduce(
    (total, entry) => total + entry.matchCount,
    0,
  );
  const cadenceMinutes = 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <article className="grid gap-3 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur sm:grid-cols-[minmax(0,1fr)_96px] sm:items-center">
        <div>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-radar-copy/72">
            {t("overview.totalVulnerabilities")}
          </span>
          <strong className="mt-2 block font-mono text-[2.2rem] leading-none text-white">
            {formatLargeMetric(trackedCount)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-radar-copy/72">
            {t("overview.statTrackedDelta", {
              count: trackedDelta,
              p1: p1Count,
            })}
          </p>
        </div>
        <MiniBars tone="success" />
      </article>

      <article className="grid gap-3 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur sm:grid-cols-[minmax(0,1fr)_96px] sm:items-center">
        <div>
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-radar-copy/72">
            {t("overview.latestIngest")}
          </span>
          <strong className="mt-2 block font-mono text-[2.2rem] leading-none text-white">
            {formatRelativeTime(latestAppliedAt)}
          </strong>
          <p className="mt-2 text-sm leading-6 text-radar-copy/72">
            {t("overview.statFreshnessDelta", {
              count: totalWatchMatches,
              cadence: cadenceMinutes,
            })}
          </p>
        </div>
        <MiniBars tone="alert" />
      </article>
    </div>
  );
}

function MiniBars({ tone }: { tone: "success" | "alert" }) {
  const bars = tone === "success" ? [36, 17, 28, 15, 11] : [12, 22, 18, 29, 40];
  const wrapperClassName =
    tone === "success" ? "bg-radar-success/10" : "bg-[#ffb4ab]/10";
  const barClassName =
    tone === "success" ? "bg-radar-success/55" : "bg-[#ffb4ab]/55";

  return (
    <div
      className={`flex h-12 w-24 items-end gap-1 p-1 ${wrapperClassName}`}
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <span
          key={`${tone}-${index}`}
          className={`block flex-1 ${barClassName}`}
          style={{ height }}
        />
      ))}
    </div>
  );
}

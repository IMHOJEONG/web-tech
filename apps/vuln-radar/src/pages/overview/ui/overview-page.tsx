import { useQuery } from "@tanstack/react-query";
import {
  getFeed,
  getHealthStatus,
  getIngestStatus,
  getKev,
  getOverview,
  getWatchlist,
} from "@/shared/api/radar";
import { OverviewCriticalCorePanel } from "./overview-critical-core-panel";
import { OverviewErrorState, mapQueryError } from "./overview-error-state";
import { OverviewKevMatrixPanel } from "./overview-kev-matrix-panel";
import {
  OverviewTotalsCard,
  OverviewWatchlistCard,
} from "./overview-stats-grid";
import { OverviewQueryPanel } from "./overview-query-panel";
import { isOverviewUnavailable } from "./overview-query-state";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { OverviewThreatStreamPanel } from "./overview-threat-stream-panel";
import { OverviewWorkspaceHeader } from "./overview-workspace-header";
import { OverviewIngestStatusPanel } from "./overview-ingest-status-panel";
import { OVERVIEW_REFRESH_INTERVAL_MS } from "./overview-ingest-model";

export function OverviewPage() {
  const { t } = useI18n();
  const healthQuery = useQuery({
    queryKey: ["radar", "health"],
    queryFn: getHealthStatus,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });
  const statusQuery = useQuery({
    queryKey: ["radar", "ingest-status"],
    queryFn: getIngestStatus,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });
  const overviewQuery = useQuery({
    queryKey: ["radar", "overview"],
    queryFn: getOverview,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });
  const feedQuery = useQuery({
    queryKey: ["radar", "feed"],
    queryFn: getFeed,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });
  const kevQuery = useQuery({
    queryKey: ["radar", "kev"],
    queryFn: getKev,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });
  const watchlistQuery = useQuery({
    queryKey: ["radar", "watchlist"],
    queryFn: getWatchlist,
    refetchInterval: OVERVIEW_REFRESH_INTERVAL_MS,
  });

  const queryStates = [
    { label: "health", query: healthQuery },
    { label: "ingest/status", query: statusQuery },
    { label: "overview", query: overviewQuery },
    { label: "feed", query: feedQuery },
    { label: "kev", query: kevQuery },
    { label: "watchlist", query: watchlistQuery },
  ];

  const failedQueries = queryStates.filter(({ query }) => query.error);
  const isRefreshing = queryStates.some(({ query }) => query.isFetching);

  const refreshAll = async () => {
    await Promise.all([
      healthQuery.refetch(),
      statusQuery.refetch(),
      overviewQuery.refetch(),
      feedQuery.refetch(),
      kevQuery.refetch(),
      watchlistQuery.refetch(),
    ]);
  };

  if (isOverviewUnavailable(queryStates.map(({ query }) => query))) {
    return (
      <OverviewErrorState
        errorDetails={failedQueries.map(({ label, query }) =>
          mapQueryError(label, query.error),
        )}
        onRetry={refreshAll}
      />
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-6">
      <OverviewWorkspaceHeader
        isRefreshing={isRefreshing}
        onRefresh={refreshAll}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(288px,336px)_minmax(0,1fr)]">
        <OverviewQueryPanel
          id="core"
          title={t("overview.coreTitle")}
          query={overviewQuery}
          onRetry={() => overviewQuery.refetch()}
        >
          {(overview) => <OverviewCriticalCorePanel overview={overview} />}
        </OverviewQueryPanel>
        <OverviewQueryPanel
          id="feed"
          title={t("overview.streamTitle")}
          query={feedQuery}
          onRetry={() => feedQuery.refetch()}
        >
          {(feed) => <OverviewThreatStreamPanel feed={feed} />}
        </OverviewQueryPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OverviewQueryPanel
          id="totals"
          title={t("overview.totalVulnerabilities")}
          query={overviewQuery}
          onRetry={() => overviewQuery.refetch()}
        >
          {(overview) => <OverviewTotalsCard overview={overview} />}
        </OverviewQueryPanel>
        <OverviewQueryPanel
          id="watchlist"
          title={t("overview.watchlistMatches")}
          query={watchlistQuery}
          onRetry={() => watchlistQuery.refetch()}
        >
          {(watchlist) => <OverviewWatchlistCard watchlist={watchlist} />}
        </OverviewQueryPanel>
      </div>
      <OverviewQueryPanel
        id="ingest"
        title={t("ingest.title")}
        query={statusQuery}
        onRetry={() => statusQuery.refetch()}
      >
        {(status) => <OverviewIngestStatusPanel status={status} />}
      </OverviewQueryPanel>
      <OverviewQueryPanel
        id="kev"
        title={t("overview.matrixTitle")}
        unavailableMessage={t("overview.matrixUnavailable")}
        query={kevQuery}
        onRetry={() => kevQuery.refetch()}
      >
        {(kev) => (
          <OverviewKevMatrixPanel
            healthStorage={
              healthQuery.error ? undefined : healthQuery.data?.storage
            }
            kev={kev}
            isLoading={false}
            status={statusQuery.error ? undefined : statusQuery.data}
          />
        )}
      </OverviewQueryPanel>
      <OverviewQueryPanel
        id="health"
        title={t("overview.connectionStatus")}
        query={healthQuery}
        onRetry={() => healthQuery.refetch()}
      >
        {(health) => (
          <p className="text-sm text-radar-copy/80">
            {t("overview.connectionAvailable", {
              storage: t(`domain.storage.${health.storage}` as const),
            })}
          </p>
        )}
      </OverviewQueryPanel>
    </section>
  );
}

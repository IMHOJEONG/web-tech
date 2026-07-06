import { useQuery } from "@tanstack/react-query";
import {
  type FeedResponse,
  type IngestStatusResponse,
  type KevResponse,
  type OverviewResponse,
  type WatchlistResponse,
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
import { OverviewLoadingState } from "./overview-loading-state";
import { OverviewStatsGrid } from "./overview-stats-grid";
import { OverviewThreatStreamPanel } from "./overview-threat-stream-panel";
import { OverviewWorkspaceHeader } from "./overview-workspace-header";

const OVERVIEW_REFRESH_INTERVAL_MS = 60_000;

export function OverviewPage() {
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

  const isLoading =
    healthQuery.isLoading ||
    statusQuery.isLoading ||
    overviewQuery.isLoading ||
    feedQuery.isLoading ||
    watchlistQuery.isLoading;

  const queryStates = [
    { label: "health", query: healthQuery },
    { label: "ingest/status", query: statusQuery },
    { label: "overview", query: overviewQuery },
    { label: "feed", query: feedQuery },
    { label: "watchlist", query: watchlistQuery },
  ];

  const failedQueries = queryStates.filter(({ query }) => query.error);
  const hasError = failedQueries.length > 0;
  const isRefreshing =
    !isLoading &&
    (healthQuery.isFetching ||
      statusQuery.isFetching ||
      overviewQuery.isFetching ||
      feedQuery.isFetching ||
      kevQuery.isFetching ||
      watchlistQuery.isFetching);

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

  if (isLoading) {
    return <OverviewLoadingState />;
  }

  if (hasError) {
    return (
      <OverviewErrorState
        errorDetails={failedQueries.map(({ label, query }) =>
          mapQueryError(label, query.error),
        )}
        onRetry={refreshAll}
      />
    );
  }

  const overview = overviewQuery.data as OverviewResponse;
  const feed = feedQuery.data as FeedResponse;
  const kev = kevQuery.data as KevResponse | undefined;
  const watchlist = watchlistQuery.data as WatchlistResponse;
  const status = statusQuery.data as IngestStatusResponse;
  const latestAppliedAt =
    status.latest.databaseUpdatedAt ??
    status.latest.upstreamLastModifiedAt ??
    status.latest.kevCatalogAddedAt ??
    status.latest.epssObservedAt ??
    status.checkedAt;

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-6">
      <OverviewWorkspaceHeader
        isRefreshing={isRefreshing}
        onRefresh={refreshAll}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(288px,336px)_minmax(0,1fr)]">
        <OverviewCriticalCorePanel
          feed={feed}
          overview={overview}
          status={status}
        />
        <OverviewThreatStreamPanel feed={feed} />
      </div>

      <OverviewStatsGrid
        latestAppliedAt={latestAppliedAt}
        overview={overview}
        status={status}
        watchlist={watchlist}
      />

      <OverviewKevMatrixPanel
        feed={feed}
        healthStorage={healthQuery.data?.storage}
        kev={kev}
        isLoading={kevQuery.isLoading && !kevQuery.data}
        overview={overview}
        status={status}
      />
    </section>
  );
}

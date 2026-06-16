import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  type FeedResponse,
  type IngestStatusResponse,
  type KevResponse,
  type OverviewResponse,
  type RadarDataSource,
  type WatchlistResponse,
  getFeed,
  getHealthStatus,
  getIngestStatus,
  getKev,
  getOverview,
  getWatchlist,
} from "@/shared/api/radar";
import { ApiError } from "@/shared/api/client";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

export function OverviewPage() {
  const { t, formatDateTime } = useI18n();
  const healthQuery = useQuery({
    queryKey: ["radar", "health"],
    queryFn: getHealthStatus,
    refetchInterval: 60_000,
  });
  const statusQuery = useQuery({
    queryKey: ["radar", "ingest-status"],
    queryFn: getIngestStatus,
    refetchInterval: 60_000,
  });
  const overviewQuery = useQuery({
    queryKey: ["radar", "overview"],
    queryFn: getOverview,
    refetchInterval: 60_000,
  });
  const feedQuery = useQuery({
    queryKey: ["radar", "feed"],
    queryFn: getFeed,
    refetchInterval: 60_000,
  });
  const kevQuery = useQuery({
    queryKey: ["radar", "kev"],
    queryFn: getKev,
    refetchInterval: 60_000,
  });
  const watchlistQuery = useQuery({
    queryKey: ["radar", "watchlist"],
    queryFn: getWatchlist,
    refetchInterval: 60_000,
  });

  const isLoading =
    healthQuery.isLoading ||
    statusQuery.isLoading ||
    overviewQuery.isLoading ||
    feedQuery.isLoading ||
    kevQuery.isLoading ||
    watchlistQuery.isLoading;

  const error =
    healthQuery.error ||
    statusQuery.error ||
    overviewQuery.error ||
    feedQuery.error ||
    kevQuery.error ||
    watchlistQuery.error;
  const queryStates = [
    { label: "health", query: healthQuery },
    { label: "ingest/status", query: statusQuery },
    { label: "overview", query: overviewQuery },
    { label: "feed", query: feedQuery },
    { label: "kev", query: kevQuery },
    { label: "watchlist", query: watchlistQuery },
  ];
  const failedQueries = queryStates.filter(({ query }) => query.error);

  const totalWatchMatches =
    watchlistQuery.data?.entries.reduce(
      (total: number, entry: WatchlistResponse["entries"][number]) =>
        total + entry.matchCount,
      0,
    ) ?? 0;
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
    return (
      <section className="page-grid">
        <article className="hero-panel">
          <p className="app-eyebrow">{t("overview.loadingEyebrow")}</p>
          <h2>{t("overview.loadingTitle")}</h2>
          <p className="hero-copy">
            {t("overview.loadingBody")} <code>{runtimeConfig.apiBasePath}</code>
          </p>
        </article>
      </section>
    );
  }

  if (error) {
    const errorDetails = failedQueries.map(({ label, query }) => {
      const queryError = query.error;

      if (queryError instanceof ApiError) {
        return {
          label,
          code: queryError.code,
          status: queryError.status,
          message: queryError.message,
        };
      }

      return {
        label,
        code: "unknown",
        status: null,
        message:
          queryError instanceof Error
            ? queryError.message
            : "Unknown query failure.",
      };
    });

    return (
      <section className="page-grid">
        <article className="hero-panel">
          <p className="app-eyebrow">{t("overview.errorEyebrow")}</p>
          <h2>{t("overview.errorTitle")}</h2>
          <p className="hero-copy">
            {t("overview.errorBody")}{" "}
            <code>{runtimeConfig.apiBasePath}/health</code>
          </p>
          <ul className="compact-list">
            {errorDetails.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <span>
                  {item.code}
                  {item.status ? ` / ${item.status}` : ""}
                  {` - ${item.message}`}
                </span>
              </li>
            ))}
          </ul>
          <button className="action-button" onClick={() => void refreshAll()}>
            {t("common.retry")}
          </button>
        </article>
      </section>
    );
  }

  const overview = overviewQuery.data as OverviewResponse;
  const feed = feedQuery.data as FeedResponse;
  const kev = kevQuery.data as KevResponse;
  const watchlist = watchlistQuery.data as WatchlistResponse;
  const status = statusQuery.data as IngestStatusResponse;
  const overviewCards = overview.cards;
  const feedItems = feed.items.slice(0, 8);
  const kevItems = kev.items.slice(0, 8);
  const statusSources = status.sources;
  const responseSources = [
    { label: "overview", source: overview.dataSource },
    { label: "feed", source: feed.dataSource },
    { label: "kev", source: kev.dataSource },
    { label: "watchlist", source: watchlist.dataSource },
  ];
  const mockFallbacks = responseSources.filter(
    ({ source }) => source.kind === "mock",
  );

  return (
    <section className="page-grid">
      <article className="hero-panel">
        <div className="panel-toolbar">
          <div>
            <p className="app-eyebrow">{t("overview.heroEyebrow")}</p>
            <h2>{t("overview.heroTitle")}</h2>
          </div>
          <button
            className="action-button"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            {isRefreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
        <p className="hero-copy">{t("overview.heroBody")}</p>
        {isRefreshing ? (
          <div className="refresh-indicator" role="status" aria-live="polite">
            <span className="refresh-indicator-dot" />
            <span>{t("overview.refreshingNotice")}</span>
          </div>
        ) : null}
        <div className="badge-row">
          <span className="config-line">
            {t("overview.apiPath")}
            <code>{runtimeConfig.apiBasePath}</code>
          </span>
          <span className="status-pill" data-tone={healthQuery.data?.storage}>
            {t("overview.storage")}{" "}
            {healthQuery.data?.storage
              ? t(`domain.storage.${healthQuery.data.storage}` as const)
              : ""}
          </span>
          <span className="status-pill" data-tone={status.mode}>
            {t("overview.upstream")}{" "}
            {status.mode ? t(`domain.upstream.${status.mode}` as const) : ""}
          </span>
          <span
            className="status-pill"
            data-tone={overview.dataSource.kind}
            title={overview.dataSource.message}
          >
            Overview {formatDataSourceLabel(overview.dataSource)}
          </span>
        </div>

        {mockFallbacks.length > 0 ? (
          <div className="source-alert" data-kind="mock">
            <strong>Mock fallback is active</strong>
            <p>
              Some cards are still rendering seed data, so timestamps may lag
              behind the latest ingest run.
            </p>
            <ul className="compact-list source-alert-list">
              {mockFallbacks.map(({ label, source }) => (
                <li key={label}>
                  <strong>{label}</strong>
                  <span>{source.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="metric-grid">
          {overviewCards.map((card: OverviewResponse["cards"][number]) => (
            <article
              key={card.id}
              className="metric-card"
              data-priority={card.priority}
            >
              <span>
                {card.id === "p0-open" ||
                card.id === "p1-open" ||
                card.id === "kev-new"
                  ? t(`domain.card.${card.id}` as const)
                  : card.label}
              </span>
              <strong>{card.value}</strong>
              <p>
                {getLocalizedCardDelta(t, card.id, card.value, card.deltaLabel)}
              </p>
            </article>
          ))}
          <article className="metric-card" data-priority="P1">
            <span>{t("overview.watchlistMatches")}</span>
            <strong>{totalWatchMatches}</strong>
            <p>
              {watchlist.entries.length} watchlist entries are currently active.
            </p>
          </article>
        </div>
      </article>

      <div className="section-grid dashboard-grid">
        <article className="section-panel">
          <div className="panel-heading">
            <h3>{t("overview.ingestFreshness")}</h3>
            <span className="panel-meta">
              {formatDateTime(status.checkedAt)}
            </span>
          </div>
          <dl className="detail-list">
            <div>
              <dt>{t("overview.databaseUpdated")}</dt>
              <dd>{formatDateTime(status.latest.databaseUpdatedAt)}</dd>
            </div>
            <div>
              <dt>{t("overview.latestUpstreamModified")}</dt>
              <dd>{formatDateTime(status.latest.upstreamLastModifiedAt)}</dd>
            </div>
            <div>
              <dt>{t("overview.latestKevAddition")}</dt>
              <dd>{formatDateTime(status.latest.kevCatalogAddedAt)}</dd>
            </div>
            <div>
              <dt>{t("overview.latestEpssObserved")}</dt>
              <dd>{formatDateTime(status.latest.epssObservedAt)}</dd>
            </div>
          </dl>
          <p className="panel-note">{t("overview.statusNote")}</p>
        </article>

        <article className="section-panel">
          <div className="panel-heading">
            <h3>{t("overview.coverageSnapshot")}</h3>
            <span className="panel-meta">
              {t("overview.vulnerabilityCount", {
                count: status.counts.vulnerabilities,
              })}
            </span>
          </div>
          <div className="coverage-grid">
            <div className="coverage-card">
              <strong>{status.counts.p0}</strong>
              <span>{t("overview.p0Items")}</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.p1}</strong>
              <span>{t("overview.p1Items")}</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.kevAdvisories}</strong>
              <span>{t("overview.kevAdvisories")}</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.enabledWatchlistEntries}</strong>
              <span>{t("overview.watchlistEntries")}</span>
            </div>
          </div>
          <ul className="compact-list">
            {statusSources.map(
              (source: IngestStatusResponse["sources"][number]) => (
                <li key={source.id}>
                  <strong>{source.name}</strong>
                  <span>
                    {getLocalizedSourceNote(t, source.id, source.note)}
                  </span>
                </li>
              ),
            )}
          </ul>
        </article>
      </div>

      <div className="section-grid dashboard-grid">
        <article className="section-panel">
          <div className="panel-heading">
            <h3>Latest Feed</h3>
            <div className="panel-heading-meta">
              <span className="panel-meta">
                {formatDateTime(feed.generatedAt)}
              </span>
              <span
                className="status-pill"
                data-tone={feed.dataSource.kind}
                title={feed.dataSource.message}
              >
                {formatDataSourceLabel(feed.dataSource)}
              </span>
            </div>
          </div>
          <p className="panel-note">{feed.dataSource.message}</p>
          <ul className="feed-list">
            {feedItems.map((item: FeedResponse["items"][number]) => (
              <li key={item.cveId}>
                <Link
                  to="/vulnerabilities/$cveId"
                  params={{ cveId: item.cveId }}
                  className="feed-card feed-card-link"
                >
                  <div className="feed-card-top">
                    <span
                      className="priority-pill"
                      data-priority={item.priority}
                    >
                      {item.priority}
                    </span>
                    {item.isKev ? (
                      <span className="signal-pill">KEV</span>
                    ) : null}
                    <span className="signal-pill" data-tone={item.severity}>
                      {item.severity}
                    </span>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.cveId}</p>
                  <div className="feed-meta">
                    <span>
                      {t("overview.feedEpss", {
                        score: item.epssScore.toFixed(3),
                      })}
                    </span>
                    <span>{formatDateTime(item.updatedAt)}</span>
                  </div>
                  {item.matchedWatchlist.length > 0 ? (
                    <div className="watchlist-tags">
                      {item.matchedWatchlist.map((value: string) => (
                        <span key={`${item.cveId}-${value}`}>{value}</span>
                      ))}
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="section-panel">
          <div className="panel-heading">
            <h3>New KEV Entries</h3>
            <div className="panel-heading-meta">
              <span className="panel-meta">
                {formatDateTime(kev.generatedAt)}
              </span>
              <span
                className="status-pill"
                data-tone={kev.dataSource.kind}
                title={kev.dataSource.message}
              >
                {formatDataSourceLabel(kev.dataSource)}
              </span>
            </div>
          </div>
          <p className="panel-note">{kev.dataSource.message}</p>
          <ul className="compact-list">
            {kevItems.map((item: KevResponse["items"][number]) => (
              <li key={item.cveId}>
                <Link
                  to="/vulnerabilities/$cveId"
                  params={{ cveId: item.cveId }}
                  className="compact-link"
                >
                  <div className="list-line">
                    <span
                      className="priority-pill"
                      data-priority={item.priority}
                    >
                      {item.priority}
                    </span>
                    <strong>{item.cveId}</strong>
                  </div>
                  <span>{item.title}</span>
                  <span>{formatDateTime(item.addedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function getLocalizedCardDelta(
  t: ReturnType<typeof useI18n>["t"],
  cardId: string,
  value: number,
  fallback: string,
) {
  if (cardId === "p0-open" || cardId === "p1-open" || cardId === "kev-new") {
    return t(`overview.cardDelta.${cardId}` as const, { count: value });
  }

  return fallback;
}

function getLocalizedSourceNote(
  t: ReturnType<typeof useI18n>["t"],
  sourceId: string,
  fallback: string,
) {
  if (sourceId === "nvd" || sourceId === "kev" || sourceId === "epss") {
    return t(`overview.sourceNote.${sourceId}` as const);
  }

  return fallback;
}

function formatDataSourceLabel(source: RadarDataSource) {
  if (source.kind === "mock") {
    return "Mock fallback";
  }

  if (source.reason === "derived_from_feed") {
    return "Derived";
  }

  return "Database";
}

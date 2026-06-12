import { useQuery } from "@tanstack/react-query";
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

export function OverviewPage() {
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
          <p className="app-eyebrow">Loading Live Radar</p>
          <h2>Backend data is being loaded into the dashboard.</h2>
          <p className="hero-copy">
            We are checking health, ingest freshness, overview cards, feed, KEV,
            and watchlist coverage through{" "}
            <code>{runtimeConfig.apiBasePath}</code>.
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
          <p className="app-eyebrow">API Error</p>
          <h2>The dashboard could not load backend data.</h2>
          <p className="hero-copy">
            Check <code>{runtimeConfig.apiBasePath}/health</code> and confirm
            the Vite proxy is pointed at the running backend.
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
            Retry
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
            <p className="app-eyebrow">Live Radar Overview</p>
            <h2>Backend data is now rendered directly inside the Vite app.</h2>
          </div>
          <button className="action-button" onClick={() => void refreshAll()}>
            Refresh
          </button>
        </div>
        <p className="hero-copy">
          This screen is reading live backend endpoints instead of a static
          placeholder. The browser stays on a stable public path while the Vite
          proxy forwards requests to the Nest backend.
        </p>
        <div className="badge-row">
          <span className="config-line">
            API path
            <code>{runtimeConfig.apiBasePath}</code>
          </span>
          <span className="status-pill" data-tone={healthQuery.data?.storage}>
            Storage {healthQuery.data?.storage}
          </span>
          <span className="status-pill" data-tone={status.mode}>
            Upstream {status.mode}
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
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.deltaLabel}</p>
            </article>
          ))}
          <article className="metric-card" data-priority="P1">
            <span>Watchlist Matches</span>
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
            <h3>Ingest Freshness</h3>
            <span className="panel-meta">
              {formatDateTime(status.checkedAt)}
            </span>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Database updated</dt>
              <dd>{formatDateTime(status.latest.databaseUpdatedAt)}</dd>
            </div>
            <div>
              <dt>Latest upstream modified</dt>
              <dd>{formatDateTime(status.latest.upstreamLastModifiedAt)}</dd>
            </div>
            <div>
              <dt>Latest KEV addition</dt>
              <dd>{formatDateTime(status.latest.kevCatalogAddedAt)}</dd>
            </div>
            <div>
              <dt>Latest EPSS observed</dt>
              <dd>{formatDateTime(status.latest.epssObservedAt)}</dd>
            </div>
          </dl>
          <p className="panel-note">{status.note}</p>
        </article>

        <article className="section-panel">
          <div className="panel-heading">
            <h3>Coverage Snapshot</h3>
            <span className="panel-meta">
              {status.counts.vulnerabilities} vulnerabilities
            </span>
          </div>
          <div className="coverage-grid">
            <div className="coverage-card">
              <strong>{status.counts.p0}</strong>
              <span>P0 items</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.p1}</strong>
              <span>P1 items</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.kevAdvisories}</strong>
              <span>KEV advisories</span>
            </div>
            <div className="coverage-card">
              <strong>{status.counts.enabledWatchlistEntries}</strong>
              <span>Watchlist entries</span>
            </div>
          </div>
          <ul className="compact-list">
            {statusSources.map(
              (source: IngestStatusResponse["sources"][number]) => (
                <li key={source.id}>
                  <strong>{source.name}</strong>
                  <span>{source.note}</span>
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
              <li key={item.cveId} className="feed-card">
                <div className="feed-card-top">
                  <span className="priority-pill" data-priority={item.priority}>
                    {item.priority}
                  </span>
                  {item.isKev ? <span className="signal-pill">KEV</span> : null}
                  <span className="signal-pill" data-tone={item.severity}>
                    {item.severity}
                  </span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.cveId}</p>
                <div className="feed-meta">
                  <span>EPSS {item.epssScore.toFixed(3)}</span>
                  <span>{formatDateTime(item.updatedAt)}</span>
                </div>
                {item.matchedWatchlist.length > 0 ? (
                  <div className="watchlist-tags">
                    {item.matchedWatchlist.map((value: string) => (
                      <span key={`${item.cveId}-${value}`}>{value}</span>
                    ))}
                  </div>
                ) : null}
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
                <div className="list-line">
                  <span className="priority-pill" data-priority={item.priority}>
                    {item.priority}
                  </span>
                  <strong>{item.cveId}</strong>
                </div>
                <span>{item.title}</span>
                <span>{formatDateTime(item.addedAt)}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available yet";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

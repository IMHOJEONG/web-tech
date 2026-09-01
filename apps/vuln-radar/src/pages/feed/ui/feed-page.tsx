import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { getFeed } from "@/shared/api/radar";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  DEFAULT_FEED_FILTERS,
  filterFeedItems,
  summarizeFeedItems,
  type FeedFilters,
} from "../model/feed-filters";
import { FeedFilterBar } from "./feed-filter-bar";
import { FeedSummaryStrip } from "./feed-summary-strip";
import { FeedVulnerabilityCard } from "./feed-vulnerability-card";

const FEED_REFRESH_INTERVAL_MS = 60_000;

export function FeedPage() {
  const { formatDateTime, t } = useI18n();
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FEED_FILTERS);
  const deferredFilters = {
    ...filters,
    query: useDeferredValue(filters.query),
  };
  const feedQuery = useQuery({
    queryKey: ["radar", "feed", "page"],
    queryFn: getFeed,
    refetchInterval: FEED_REFRESH_INTERVAL_MS,
  });

  if (feedQuery.isLoading) {
    return <FeedLoadingState />;
  }

  if (feedQuery.error || !feedQuery.data) {
    return <FeedErrorState onRetry={feedQuery.refetch} />;
  }

  const filteredItems = filterFeedItems(feedQuery.data.items, deferredFilters);
  const stats = summarizeFeedItems(filteredItems);

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-5">
      <header className="flex flex-col items-start justify-between gap-4 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)] backdrop-blur lg:flex-row lg:items-end">
        <div>
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
            {t("feed.heroEyebrow")}
          </p>
          <h1 className="mt-2 max-w-[820px] font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.05em] text-white">
            {t("feed.heroTitle")}
          </h1>
          <p className="mt-3 max-w-[68ch] text-sm leading-6 text-radar-copy/72">
            {t("feed.heroBody")}
          </p>
        </div>
        <div className="grid gap-2 font-mono text-[0.72rem] text-radar-copy/70">
          <span className="rounded-sm border border-radar-border bg-radar-panel-strong px-3 py-2">
            {runtimeConfig.apiBasePath}/feed
          </span>
          <span
            className="rounded-sm border border-radar-success/24 bg-radar-success/10 px-3 py-2 text-radar-success"
            title={feedQuery.data.dataSource.message}
          >
            {feedQuery.data.dataSource.kind.toUpperCase()}
          </span>
        </div>
      </header>

      <FeedFilterBar
        filters={filters}
        labels={{
          all: t("feed.filterAll"),
          kevOnly: t("feed.filterKevOnly"),
          priority: t("feed.filterPriority"),
          searchPlaceholder: t("feed.searchPlaceholder"),
          severity: t("feed.filterSeverity"),
          title: t("feed.filterTitle"),
          resultCount: t("feed.resultCount"),
        }}
        onFiltersChange={setFilters}
        resultCount={filteredItems.length}
      />

      <FeedSummaryStrip
        labels={{
          total: t("feed.summaryTotal"),
          p0: t("feed.summaryP0"),
          kev: t("feed.summaryKev"),
          watchlistMatches: t("feed.summaryWatchlistMatches"),
        }}
        stats={stats}
      />

      {filteredItems.length > 0 ? (
        <div className="grid gap-3">
          {filteredItems.map((item) => (
            <FeedVulnerabilityCard
              key={item.cveId}
              item={item}
              formatDateTime={formatDateTime}
              labels={{
                detail: t("common.detail"),
                epss: t("feed.epss"),
                freshness: t("feed.freshness"),
                freshnessStatuses: {
                  aging: t("domain.freshness.aging"),
                  fresh: t("domain.freshness.fresh"),
                  stale: t("domain.freshness.stale"),
                  unknown: t("domain.freshness.unknown"),
                },
                kev: t("feed.kev"),
                noWatchlistMatch: t("feed.noWatchlistMatch"),
                reliability: t("feed.reliability"),
                reliabilityLevels: {
                  high: t("domain.reliability.high"),
                  low: t("domain.reliability.low"),
                  medium: t("domain.reliability.medium"),
                  unknown: t("domain.reliability.unknown"),
                  verified: t("domain.reliability.verified"),
                },
                updated: t("feed.updated"),
              }}
            />
          ))}
        </div>
      ) : (
        <article className="rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-8 text-center">
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/60">
            {t("feed.emptyEyebrow")}
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
            {t("feed.emptyTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-6 text-radar-copy/70">
            {t("feed.emptyBody")}
          </p>
        </article>
      )}
    </section>
  );
}

function FeedLoadingState() {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-5">
      <article className="rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5">
        <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
          {t("feed.loadingEyebrow")}
        </p>
        <div className="mt-4 h-10 w-full max-w-[640px] animate-pulse rounded-sm bg-radar-panel-muted" />
        <div className="mt-3 h-4 w-full max-w-[520px] animate-pulse rounded-sm bg-radar-panel-muted" />
      </article>
      {Array.from({ length: 4 }, (_, index) => (
        <article
          key={`feed-loading-${index}`}
          className="rounded-sm border border-radar-border/70 bg-radar-panel px-4 py-4"
        >
          <div className="flex gap-2">
            <div className="h-8 w-14 animate-pulse rounded-sm bg-radar-panel-muted" />
            <div className="h-8 w-24 animate-pulse rounded-sm bg-radar-panel-muted" />
          </div>
          <div className="mt-4 h-6 w-[72%] animate-pulse rounded-sm bg-radar-panel-muted" />
          <div className="mt-3 h-4 w-36 animate-pulse rounded-sm bg-radar-panel-muted" />
        </article>
      ))}
    </section>
  );
}

function FeedErrorState({
  onRetry,
}: {
  onRetry: () => void | Promise<unknown>;
}) {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-5">
      <article className="rounded-sm border border-radar-critical/35 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.24)]">
        <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-critical">
          {t("feed.errorEyebrow")}
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
          {t("feed.errorTitle")}
        </h1>
        <p className="mt-3 max-w-[62ch] text-sm leading-6 text-radar-copy/72">
          {t("feed.errorBody")}
        </p>
        <button
          type="button"
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-sm border border-radar-primary/26 bg-radar-critical/10 px-4 text-sm font-medium text-radar-primary transition hover:-translate-y-px hover:bg-radar-critical/15"
          onClick={() => void onRetry()}
        >
          {t("common.retry")}
        </button>
      </article>
    </section>
  );
}

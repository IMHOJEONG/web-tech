import type { IngestStatusResponse } from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  buildIngestDisplay,
  formatStoredSourceDate,
  OVERVIEW_REFRESH_INTERVAL_MS,
} from "./overview-ingest-model";

export function OverviewIngestStatusPanel({
  status,
}: {
  status: IngestStatusResponse;
}) {
  const { t, formatDateTime, locale } = useI18n();
  const model = buildIngestDisplay(status);
  const tone =
    model.state === "failed"
      ? "text-[#ffb4ab]"
      : model.state === "partial" || model.state === "review"
        ? "text-radar-warning"
        : "text-radar-copy";

  return (
    <section
      aria-labelledby="overview-ingest-title"
      className="min-w-0 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="overview-ingest-title"
          className="font-display text-lg font-semibold text-white"
        >
          {t("ingest.title")}
        </h2>
        <span className={`text-sm font-medium ${tone}`}>
          {t(`ingest.state.${model.state}`)}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-radar-copy/72">{t("ingest.screenCadence")}</dt>
          <dd className="mt-1 text-white">
            {t("ingest.minutes", {
              count: OVERVIEW_REFRESH_INTERVAL_MS / 60_000,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-radar-copy/72">
            {t("ingest.collectionCadence")}
          </dt>
          <dd className="mt-1 text-white">
            {!status.scheduler
              ? t("ingest.unknown")
              : status.scheduler.enabled
                ? t("ingest.minutes", {
                    count: status.scheduler.intervalMinutes,
                  })
                : t("ingest.manual")}
          </dd>
        </div>
        <div>
          <dt className="text-radar-copy/72">{t("ingest.lastSuccess")}</dt>
          <dd className="mt-1 break-words text-white">
            {formatDateTime(model.lastSuccessAt)}
          </dd>
        </div>
        <div>
          <dt className="text-radar-copy/72">{t("ingest.statusChecked")}</dt>
          <dd className="mt-1 break-words text-white">
            {formatDateTime(status.checkedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-radar-copy/72">
            {t(
              model.state === "running"
                ? "ingest.runStarted"
                : "ingest.runFinished",
            )}
          </dt>
          <dd className="mt-1 break-words text-white">
            {formatDateTime(
              (model.state === "running"
                ? status.observation?.lastStartedAt
                : status.observation?.lastFinishedAt) ?? null,
            )}
          </dd>
        </div>
      </dl>
      {model.state === "review" && (
        <p className="mt-3 text-sm text-radar-warning">
          {t("ingest.reviewNote")}
        </p>
      )}
      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {model.sources.map((source) => (
          <li
            key={source.id}
            className="min-w-0 rounded-sm border border-radar-border bg-radar-panel-muted p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-mono text-sm font-semibold text-white">
                {source.id === "kev" ? "CISA KEV" : source.id.toUpperCase()}
              </h3>
              <span
                className={`text-xs ${source.outcome === "failed" ? "text-[#ffb4ab]" : "text-radar-copy/80"}`}
              >
                {t(`ingest.source.${source.outcome}`)}
              </span>
            </div>
            <dl className="mt-3 space-y-3 text-xs leading-5 text-radar-copy/72">
              <div>
                <dt>{t("ingest.fetchSuccess")}</dt>
                <dd className="break-words text-white">
                  {formatDateTime(source.lastFetchSuccessAt)}
                </dd>
              </div>
              <div>
                <dt>{t(`ingest.dataDate.${source.id}`)}</dt>
                <dd className="break-words text-white">
                  {formatStoredSourceDate(
                    source.dataUpdatedAt,
                    source.id,
                    locale,
                  ) ?? t("common.notAvailableYet")}
                </dd>
              </div>
              {source.lastFailureAt && (
                <div>
                  <dt>{t("ingest.lastFailure")}</dt>
                  <dd className="break-words text-white">
                    {formatDateTime(source.lastFailureAt)}
                  </dd>
                </div>
              )}
              {source.consecutiveFailures !== null &&
                source.consecutiveFailures > 0 && (
                  <div>
                    <dt>{t("ingest.failureCount")}</dt>
                    <dd className="text-[#ffb4ab]">
                      {source.consecutiveFailures}
                    </dd>
                  </div>
                )}
            </dl>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-radar-copy/72">
        {t(status.observation ? "ingest.processScope" : "ingest.legacyScope")}
      </p>
    </section>
  );
}

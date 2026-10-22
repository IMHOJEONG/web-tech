import type { ReactNode } from "react";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  getOverviewQueryState,
  type OverviewQuerySnapshot,
} from "./overview-query-state";

interface OverviewQueryPanelProps<T> {
  id: string;
  title: string;
  unavailableMessage?: string;
  query: OverviewQuerySnapshot<T>;
  onRetry: () => unknown;
  children: (data: T) => ReactNode;
}

export function OverviewQueryPanel<T>({
  id,
  title,
  unavailableMessage,
  query,
  onRetry,
  children,
}: OverviewQueryPanelProps<T>) {
  const { t, formatDateTime } = useI18n();
  const state = getOverviewQueryState(query);
  return (
    <div data-overview-panel={id} className="grid min-w-0 content-start gap-3">
      {(state === "stale" || state === "unavailable") && (
        <div
          role={state === "stale" ? "status" : "alert"}
          className="rounded-sm border border-radar-warning/40 bg-radar-panel px-4 py-3 text-sm text-radar-copy"
        >
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 leading-6">
            {state === "unavailable" && unavailableMessage
              ? unavailableMessage
              : t(
                  state === "stale"
                    ? "overview.panelStale"
                    : "overview.panelUnavailable",
                )}
          </p>
          {state === "stale" && query.dataUpdatedAt > 0 && (
            <p className="mt-1 text-xs text-radar-copy/80">
              {t("overview.panelLastLoaded", {
                time: formatDateTime(
                  new Date(query.dataUpdatedAt).toISOString(),
                ),
              })}
            </p>
          )}
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => void onRetry()}
            className="mt-3 min-h-10 rounded-sm border border-radar-primary/40 px-3 text-radar-primary hover:bg-radar-panel-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-radar-primary disabled:cursor-wait disabled:opacity-60"
          >
            {t(
              query.isFetching
                ? "overview.panelRetrying"
                : "overview.panelRetry",
              { panel: title },
            )}
          </button>
        </div>
      )}
      {query.data !== undefined ? (
        <div data-overview-content className="min-w-0">
          {children(query.data)}
        </div>
      ) : state === "pending" ? (
        <div
          role="status"
          className="min-h-32 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5"
        >
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-3 text-sm text-radar-copy/80">
            {t("overview.panelLoading")}
          </p>
          <div
            aria-hidden="true"
            className="mt-4 h-4 w-2/3 rounded-sm bg-radar-panel-muted motion-safe:animate-pulse"
          />
        </div>
      ) : null}
    </div>
  );
}

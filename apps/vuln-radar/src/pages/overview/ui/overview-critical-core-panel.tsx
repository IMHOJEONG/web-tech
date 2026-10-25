import { CircleAlert } from "lucide-react";
import type { OverviewResponse } from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  formatLargeMetric,
  getCriticalCount,
  getTrackedCount,
} from "./overview-view-model";

export function OverviewCriticalCorePanel({
  overview,
}: {
  overview: OverviewResponse;
}) {
  const { t } = useI18n();
  return (
    <article className="rounded-sm border border-radar-critical-strong bg-radar-panel px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,82,95,0.08),0_0_14px_rgba(255,82,95,0.14)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#ff6b74]">
            {t("overview.coreTitle")}
          </h2>
          <p className="mt-3 max-w-[30ch] text-sm leading-6 text-radar-copy/72">
            {t("overview.aggregateScope")}
          </p>
        </div>
        <CircleAlert
          size={20}
          strokeWidth={1.8}
          className="shrink-0 text-[#ffb4ab]"
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <article className="rounded-sm border border-[#ffb4ab]/18 bg-radar-critical-strong/12 px-4 py-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-radar-copy/78">
            {t("overview.activeP0Threats")}
          </span>
          <strong className="mt-2 block font-mono text-[2rem] leading-none text-white">
            {formatLargeMetric(getCriticalCount(undefined, overview.cards))}
          </strong>
        </article>
        <article className="rounded-sm border border-radar-border bg-radar-panel-muted px-4 py-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-radar-copy/78">
            {t("overview.trackedVulnerabilities")}
          </span>
          <strong className="mt-2 block font-mono text-[2rem] leading-none text-white">
            {formatLargeMetric(getTrackedCount(undefined, overview.cards))}
          </strong>
        </article>
      </div>
    </article>
  );
}

import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleAlert } from "lucide-react";
import type {
  FeedResponse,
  IngestStatusResponse,
  OverviewResponse,
} from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { formatLargeMetric, getCriticalCount } from "./overview-view-model";

interface OverviewCriticalCorePanelProps {
  feed: FeedResponse;
  overview: OverviewResponse;
  status: IngestStatusResponse;
}

export function OverviewCriticalCorePanel({
  feed,
  overview,
  status,
}: OverviewCriticalCorePanelProps) {
  const { t } = useI18n();
  const criticalCount = getCriticalCount(status, overview.cards);
  const trackedCount = status.counts.vulnerabilities;
  const criticalItems = feed.items.slice(0, 2);

  return (
    <article className="rounded-sm border border-radar-critical-strong bg-radar-panel px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,82,95,0.08),0_0_14px_rgba(255,82,95,0.14)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#ff6b74]">
            {t("overview.coreTitle")}
          </p>
          <p className="mt-3 max-w-[30ch] text-sm leading-6 text-radar-copy/72">
            {overview.highlights[0] ?? t("overview.heroBody")}
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
            {formatLargeMetric(criticalCount)}
          </strong>
        </article>
        <article className="rounded-sm border border-radar-border bg-radar-panel-muted px-4 py-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-radar-copy/78">
            {t("overview.trackedVulnerabilities")}
          </span>
          <strong className="mt-2 block font-mono text-[2rem] leading-none text-white">
            {formatLargeMetric(trackedCount)}
          </strong>
        </article>
      </div>

      <ul className="mt-5 grid gap-3">
        {criticalItems.map((item) => (
          <li key={item.cveId}>
            <Link
              to="/vulnerabilities/$cveId"
              params={{ cveId: item.cveId }}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-sm border border-radar-border bg-radar-panel-strong px-3 py-3 transition hover:-translate-y-px hover:border-radar-primary/22 hover:bg-radar-panel-muted"
            >
              <span className="inline-flex items-center bg-[#ffb4ab] px-2 py-1 font-mono text-[0.68rem] text-[#690005]">
                {item.cveId}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-white">
                {item.title}
              </span>
              <ArrowRight
                size={14}
                strokeWidth={1.8}
                className="text-radar-copy/70"
              />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

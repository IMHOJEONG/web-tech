import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import type { FeedResponse } from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import { formatRelativeTime } from "./overview-view-model";

interface OverviewThreatStreamPanelProps {
  feed: FeedResponse;
}

export function OverviewThreatStreamPanel({
  feed,
}: OverviewThreatStreamPanelProps) {
  const { t } = useI18n();
  const streamItems = feed.items.slice(0, 4);

  return (
    <article className="rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
            {t("overview.streamTitle")}
          </h2>
          <Radar size={18} strokeWidth={1.9} className="text-radar-success" />
        </div>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-radar-copy/72">
          {t("overview.realTimeTelemetry")}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {streamItems.map((item) => (
          <Link
            key={item.cveId}
            to="/vulnerabilities/$cveId"
            params={{ cveId: item.cveId }}
            className="border-l-2 border-radar-warning bg-radar-panel-muted px-4 py-4 transition hover:-translate-y-px hover:bg-[rgba(51,53,57,0.58)] data-[severity=critical]:border-l-[#ffb4ab] data-[severity=low]:border-l-radar-success"
            data-severity={item.severity}
          >
            <div className="flex items-center justify-between gap-3 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-radar-copy/72">
              <span className={getSeverityClassName(item.severity)}>
                {getSeverityLabel(t, item.severity)}
              </span>
              <span>{formatRelativeTime(item.updatedAt)}</span>
            </div>
            <strong className="mt-2 block text-[0.98rem] leading-6 text-white">
              {item.title}
            </strong>
            <p className="mt-1 text-sm text-radar-copy/70">{item.cveId}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}

function getSeverityLabel(
  t: ReturnType<typeof useI18n>["t"],
  severity: FeedResponse["items"][number]["severity"],
) {
  switch (severity) {
    case "critical":
      return t("overview.severity.critical");
    case "high":
      return t("overview.severity.high");
    case "medium":
      return t("overview.severity.medium");
    case "low":
      return t("overview.severity.low");
    default:
      return severity;
  }
}

function getSeverityClassName(
  severity: FeedResponse["items"][number]["severity"],
) {
  switch (severity) {
    case "critical":
      return "text-[#ffb4ab]";
    case "high":
      return "text-radar-warning";
    case "medium":
      return "text-radar-primary";
    case "low":
      return "text-radar-success";
    default:
      return "text-radar-copy/72";
  }
}

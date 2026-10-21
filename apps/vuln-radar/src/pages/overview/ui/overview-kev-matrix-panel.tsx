import { Link } from "@tanstack/react-router";
import { MoreVertical } from "lucide-react";
import type { IngestStatusResponse, KevResponse } from "@/shared/api/radar";
import { useI18n } from "@/shared/i18n/i18n-provider";
import {
  buildKevMatrixItems,
  formatDataSourceLabel,
} from "./overview-view-model";

interface OverviewKevMatrixPanelProps {
  healthStorage: "mock" | "database" | undefined;
  isLoading: boolean;
  kev?: KevResponse;
  status: IngestStatusResponse;
}

export function OverviewKevMatrixPanel({
  healthStorage,
  isLoading,
  kev,
  status,
}: OverviewKevMatrixPanelProps) {
  const { t, formatDateTime } = useI18n();
  const matrixItems = buildKevMatrixItems(kev);

  return (
    <article className="overflow-hidden rounded-sm border border-radar-border/70 bg-[rgba(12,14,18,0.82)] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 border-b border-radar-border/60 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
            {t("overview.matrixTitle")}
          </h2>
          <p className="mt-3 max-w-[62ch] text-sm leading-6 text-radar-copy/72">
            {t("overview.matrixDescription", {
              storage: healthStorage
                ? t(`domain.storage.${healthStorage}` as const)
                : t("common.notAvailableYet"),
              upstream: status.mode
                ? t(`domain.upstream.${status.mode}` as const)
                : t("common.notAvailableYet"),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex min-h-9 items-center rounded-sm border border-radar-border bg-radar-panel-strong px-3 font-mono text-[0.72rem] text-white"
            title={kev?.dataSource.message}
          >
            {kev
              ? formatDataSourceLabel(kev.dataSource)
              : t("common.notAvailableYet")}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-sm border border-radar-border bg-radar-panel-strong px-3 font-mono text-[0.72rem] text-radar-copy/78">
            {formatDateTime(status.checkedAt)}
          </span>
        </div>
      </div>

      <div className="min-h-[332px] overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-radar-panel-muted">
              <TableHead>{t("overview.tableCveId")}</TableHead>
              <TableHead>{t("overview.tableComponent")}</TableHead>
              <TableHead>{t("overview.tableExploitScore")}</TableHead>
              <TableHead>{t("overview.tableStatus")}</TableHead>
              <TableHead align="right">{t("overview.tableActions")}</TableHead>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr
                  key={`kev-skeleton-${index}`}
                  className="border-b border-radar-border-soft"
                >
                  <td className="px-4 py-4 align-middle">
                    <div className="h-4 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="h-4 w-[88%] animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="inline-flex items-center gap-3">
                      <div className="h-1.5 w-24 animate-pulse rounded-full bg-radar-panel-muted" />
                      <div className="h-4 w-12 animate-pulse rounded-sm bg-radar-panel-muted" />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <div className="h-7 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4 text-right align-middle">
                    <div className="ml-auto h-7 w-7 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                </tr>
              ))
            ) : matrixItems.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-radar-copy/72"
                >
                  {t(
                    kev ? "overview.matrixEmpty" : "overview.matrixUnavailable",
                  )}
                </td>
              </tr>
            ) : (
              matrixItems.map((item) => (
                <tr
                  key={item.cveId}
                  className="border-b border-radar-border-soft"
                >
                  <td className="px-4 py-4 align-middle">
                    <span className="font-mono text-[0.85rem] text-radar-primary">
                      {item.cveId}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-sm text-white">
                    {item.title}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    {item.epssScore === null ? (
                      <span className="text-sm text-radar-copy/72">
                        {t("overview.epssUnknown")}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-3">
                        <div
                          className="relative h-1.5 w-24 overflow-hidden rounded-full bg-radar-panel-muted"
                          role="meter"
                          aria-label={`EPSS ${item.cveId}`}
                          aria-valuemin={0}
                          aria-valuemax={1}
                          aria-valuenow={item.epssScore}
                        >
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-radar-primary"
                            style={{
                              width: `${item.epssScore * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[0.85rem] text-radar-primary">
                          {new Intl.NumberFormat("en-US", {
                            maximumSignificantDigits: 6,
                          }).format(item.epssScore)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span className={getPriorityPillClassName(item.priority)}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right align-middle">
                    <Link
                      to="/vulnerabilities/$cveId"
                      params={{ cveId: item.cveId }}
                      className="inline-flex size-7 items-center justify-center rounded-sm border border-transparent text-radar-copy/72 transition hover:-translate-y-px hover:border-radar-primary/22 hover:bg-radar-panel-muted"
                      aria-label={t("common.detail")}
                    >
                      <MoreVertical size={16} strokeWidth={1.8} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function TableHead({
  align = "left",
  children,
}: {
  align?: "left" | "right";
  children: string;
}) {
  return (
    <th
      className={`px-4 py-4 font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] text-radar-copy/72 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function getPriorityPillClassName(priority: "P0" | "P1" | "P2" | "P3") {
  const baseClassName =
    "inline-flex min-h-8 items-center rounded-sm border px-3 font-mono text-[0.72rem]";

  switch (priority) {
    case "P0":
      return `${baseClassName} border-[#ffb4ab]/45 text-[#ffb4ab]`;
    case "P1":
      return `${baseClassName} border-radar-warning/45 text-radar-warning`;
    case "P2":
      return `${baseClassName} border-radar-success/35 bg-radar-success/8 text-radar-success`;
    case "P3":
      return `${baseClassName} border-radar-border text-radar-copy/78`;
    default:
      return baseClassName;
  }
}

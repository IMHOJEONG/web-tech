import { RefreshCcw } from "lucide-react";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

interface OverviewWorkspaceHeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
}

export function OverviewWorkspaceHeader({
  isRefreshing,
  onRefresh,
}: OverviewWorkspaceHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
          {t("app.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold tracking-[-0.05em] text-white">
          {runtimeConfig.appTitle}
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex min-h-10 items-center gap-2 rounded-sm border border-radar-border bg-radar-panel-strong px-3 font-mono text-[0.72rem] text-radar-primary">
          {t("overview.apiPath")}
          <code>{runtimeConfig.apiBasePath}</code>
        </span>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-radar-primary/22 bg-radar-panel-strong px-4 text-sm font-medium text-radar-primary transition hover:-translate-y-px hover:border-radar-primary/30 hover:bg-radar-critical/10"
          onClick={() => void onRefresh()}
          disabled={isRefreshing}
          aria-busy={isRefreshing}
        >
          <RefreshCcw size={14} strokeWidth={1.8} />
          <span>
            {isRefreshing ? t("common.refreshing") : t("common.refresh")}
          </span>
        </button>
      </div>
    </header>
  );
}

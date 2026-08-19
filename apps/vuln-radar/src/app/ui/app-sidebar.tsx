import {
  Activity,
  Crosshair,
  Database,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { AppSidebarLink } from "./app-sidebar-link";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

function getBrandInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar() {
  const { t } = useI18n();
  const initials = getBrandInitials(runtimeConfig.appTitle);

  return (
    <aside className="flex items-center justify-between gap-4 border-b border-radar-border/70 bg-[rgba(17,19,24,0.92)] px-4 py-4 backdrop-blur md:sticky md:top-0 md:min-h-screen md:flex-col md:justify-start md:gap-6 md:border-b-0 md:border-r md:px-0 md:py-6">
      <div className="flex flex-col items-center gap-3">
        <div
          className="inline-flex size-9 items-center justify-center rounded-sm border border-radar-critical/20 text-radar-critical shadow-[inset_0_0_0_1px_rgba(255,82,95,0.12)]"
          aria-hidden="true"
        >
          <Crosshair size={18} strokeWidth={1.75} />
        </div>
        <div
          className="font-mono text-[0.68rem] font-bold tracking-[0.28em] text-radar-copy/55 [text-orientation:mixed] [writing-mode:vertical-rl] max-md:[writing-mode:horizontal-tb] max-md:tracking-[0.18em]"
          aria-hidden="true"
        >
          {initials}
        </div>
        <span className="sr-only">{runtimeConfig.appTitle}</span>
      </div>

      <nav
        className="flex flex-1 flex-col items-center gap-2 max-md:flex-row max-md:flex-none"
        aria-label={t("nav.primary")}
      >
        <AppSidebarLink
          to="/overview"
          icon={Activity}
          label={t("nav.overview")}
        />
        <AppSidebarLink icon={ShieldAlert} label={t("nav.alerts")} />
        <AppSidebarLink icon={Database} label={t("nav.assets")} />
        <AppSidebarLink icon={Inbox} label={t("nav.inbox")} />
      </nav>
    </aside>
  );
}

import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

interface AppSidebarLinkProps {
  icon: LucideIcon;
  label: string;
  to?: "/overview";
}

const baseClassName =
  "inline-flex size-9 items-center justify-center rounded-sm border border-transparent text-radar-copy/70 transition hover:border-radar-primary/20 hover:bg-radar-panel-muted hover:text-radar-primary data-[active=true]:border-radar-success/30 data-[active=true]:border-r-2 data-[active=true]:bg-radar-panel-muted data-[active=true]:text-radar-success data-[active=true]:shadow-[inset_0_0_8px_rgba(0,228,117,0.18)] disabled:cursor-not-allowed disabled:opacity-60";

export function AppSidebarLink({ icon: Icon, label, to }: AppSidebarLinkProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={baseClassName}
        activeProps={{ "data-active": "true" }}
        aria-label={label}
      >
        <Icon size={18} strokeWidth={1.8} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={baseClassName}
      disabled
      title={label}
      aria-label={label}
    >
      <Icon size={18} strokeWidth={1.8} />
    </button>
  );
}

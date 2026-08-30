import type { ReactNode } from "react";
import type {
  FeedFilters,
  FeedKevFilter,
  FeedPriorityFilter,
  FeedSeverityFilter,
} from "../model/feed-filters";

interface FeedFilterBarProps {
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  resultCount: number;
  labels: {
    all: string;
    kevOnly: string;
    priority: string;
    searchPlaceholder: string;
    severity: string;
    title: string;
    resultCount: string;
  };
}

const priorityOptions = ["all", "P0", "P1", "P2", "P3"] as const;
const severityOptions = ["all", "critical", "high", "medium", "low"] as const;
const kevOptions = ["all", "kev"] as const;

export function FeedFilterBar({
  filters,
  labels,
  onFiltersChange,
  resultCount,
}: FeedFilterBarProps) {
  return (
    <section className="rounded-sm border border-radar-border/70 bg-radar-panel px-4 py-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
            {labels.title}
          </p>
          <p className="mt-2 font-mono text-xs text-radar-copy/62">
            {labels.resultCount.replace("{{count}}", String(resultCount))}
          </p>
        </div>

        <label className="grid w-full gap-2 lg:max-w-[360px]">
          <span className="sr-only">{labels.searchPlaceholder}</span>
          <input
            value={filters.query}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                query: event.target.value,
              })
            }
            placeholder={labels.searchPlaceholder}
            className="min-h-11 rounded-sm border border-radar-border bg-radar-panel-strong px-3 text-sm text-white outline-none transition placeholder:text-radar-copy/38 focus:border-radar-primary/50 focus:shadow-[0_0_0_3px_rgba(255,179,179,0.08)]"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <FilterGroup label={labels.priority}>
          {priorityOptions.map((priority) => (
            <FilterPill
              key={priority}
              active={filters.priority === priority}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  priority: priority as FeedPriorityFilter,
                })
              }
            >
              {priority === "all" ? labels.all : priority}
            </FilterPill>
          ))}
        </FilterGroup>

        <FilterGroup label={labels.severity}>
          {severityOptions.map((severity) => (
            <FilterPill
              key={severity}
              active={filters.severity === severity}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  severity: severity as FeedSeverityFilter,
                })
              }
            >
              {severity === "all" ? labels.all : severity.toUpperCase()}
            </FilterPill>
          ))}
        </FilterGroup>

        <FilterGroup label="KEV">
          {kevOptions.map((kev) => (
            <FilterPill
              key={kev}
              active={filters.kev === kev}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  kev: kev as FeedKevFilter,
                })
              }
            >
              {kev === "all" ? labels.all : labels.kevOnly}
            </FilterPill>
          ))}
        </FilterGroup>
      </div>
    </section>
  );
}

function FilterGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div>
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-radar-copy/56">
        {label}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 shrink-0 items-center rounded-sm border border-radar-border bg-radar-panel-muted px-3 font-mono text-[0.72rem] text-radar-copy/72 transition hover:-translate-y-px hover:border-radar-primary/28 hover:text-radar-primary data-[active=true]:border-radar-success/36 data-[active=true]:bg-radar-success/10 data-[active=true]:text-radar-success"
      data-active={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

import { type ReactNode, useId, useRef, useState } from "react";
import type {
  FeedFilters,
  FeedKevFilter,
  FeedPriorityFilter,
  FeedSeverityFilter,
} from "../model/feed-filters";

interface FeedFilterBarProps {
  pending?: boolean;
  pendingLabel?: string;
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  resultCount: number;
  labels: {
    all: string;
    kevOnly: string;
    priority: string;
    searchLabel: string;
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
  pending,
  pendingLabel,
  filters,
  labels,
  onFiltersChange,
  resultCount,
}: FeedFilterBarProps) {
  const titleId = useId();
  const queryId = useId();
  const composing = useRef(false);
  const [draft, setDraft] = useState({
    sourceQuery: filters.query,
    value: filters.query,
  });
  // Direct navigation and browser history can supply a different search value.
  if (draft.sourceQuery !== filters.query) {
    setDraft({ sourceQuery: filters.query, value: filters.query });
  }

  function publishQuery(value: string) {
    if (value !== filters.query) {
      onFiltersChange({ ...filters, query: value });
    }
  }

  return (
    <search
      aria-labelledby={titleId}
      className="rounded-sm border border-radar-border/70 bg-radar-panel px-4 py-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)] backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p
            id={titleId}
            className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70"
          >
            {labels.title}
          </p>
          <p className="mt-2 font-mono text-xs text-radar-copy/62">
            {pending
              ? pendingLabel
              : labels.resultCount.replace("{{count}}", String(resultCount))}
          </p>
        </div>

        <div className="grid w-full gap-2 lg:max-w-[360px]">
          <label
            htmlFor={queryId}
            className="text-sm font-medium text-radar-copy"
          >
            {labels.searchLabel}
          </label>
          <input
            id={queryId}
            maxLength={120}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={draft.value}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onChange={(event) => {
              const value = event.currentTarget.value;
              // Keep the controlled input in sync while the browser owns the composition.
              setDraft({ sourceQuery: filters.query, value });
              if (!composing.current && value !== draft.value) {
                publishQuery(value);
              }
            }}
            onCompositionEnd={(event) => {
              if (!composing.current) return;
              composing.current = false;
              const value = event.currentTarget.value;
              setDraft({ sourceQuery: filters.query, value });
              publishQuery(value);
            }}
            placeholder={labels.searchPlaceholder}
            className="min-h-11 rounded-sm border border-radar-border bg-radar-panel-strong px-3 text-sm text-white transition placeholder:text-radar-copy/38 focus:border-radar-primary/50 focus:shadow-[0_0_0_3px_rgba(255,179,179,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-radar-primary forced-colors:focus-visible:outline-[CanvasText]"
          />
        </div>
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
    </search>
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
    <fieldset className="min-w-0">
      <legend className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-radar-copy/56">
        {label}
      </legend>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">{children}</div>
    </fieldset>
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
      className="inline-flex min-h-9 shrink-0 items-center rounded-sm border border-radar-border bg-radar-panel-muted px-3 font-mono text-[0.72rem] text-radar-copy/72 transition-colors motion-safe:transition motion-safe:hover:-translate-y-px hover:border-radar-primary/28 hover:text-radar-primary data-[active=true]:border-radar-success/36 data-[active=true]:bg-radar-success/10 data-[active=true]:text-radar-success"
      data-active={active}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

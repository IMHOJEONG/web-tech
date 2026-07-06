import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

export function OverviewLoadingState() {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-6">
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
          <span className="inline-flex min-h-10 w-28 animate-pulse rounded-sm border border-radar-primary/22 bg-radar-panel-strong" />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(288px,336px)_minmax(0,1fr)]">
        <article className="rounded-sm border border-radar-critical-strong bg-radar-panel px-5 py-5 shadow-[inset_0_0_0_1px_rgba(255,82,95,0.08),0_0_14px_rgba(255,82,95,0.14)]">
          <div className="h-4 w-32 animate-pulse rounded-sm bg-radar-panel-muted" />
          <div className="mt-4 h-4 w-[88%] animate-pulse rounded-sm bg-radar-panel-muted" />
          <div className="mt-2 h-4 w-[72%] animate-pulse rounded-sm bg-radar-panel-muted" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-sm border border-[#ffb4ab]/18 bg-radar-critical-strong/12 px-4 py-4">
              <div className="h-3 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
              <div className="mt-3 h-9 w-20 animate-pulse rounded-sm bg-radar-panel-muted" />
            </div>
            <div className="rounded-sm border border-radar-border bg-radar-panel-muted px-4 py-4">
              <div className="h-3 w-32 animate-pulse rounded-sm bg-radar-panel-muted" />
              <div className="mt-3 h-9 w-24 animate-pulse rounded-sm bg-radar-panel-muted" />
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={`core-skeleton-${index}`}
                className="grid grid-cols-[96px_minmax(0,1fr)_16px] items-center gap-3 rounded-sm border border-radar-border bg-radar-panel-strong px-3 py-3"
              >
                <div className="h-6 animate-pulse rounded-sm bg-radar-panel-muted" />
                <div className="h-4 animate-pulse rounded-sm bg-radar-panel-muted" />
                <div className="h-4 animate-pulse rounded-sm bg-radar-panel-muted" />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="h-8 w-44 animate-pulse rounded-sm bg-radar-panel-muted" />
            <div className="h-4 w-32 animate-pulse rounded-sm bg-radar-panel-muted" />
          </div>
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={`stream-skeleton-${index}`}
                className="border-l-2 border-radar-warning bg-radar-panel-muted px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="h-3 w-24 animate-pulse rounded-sm bg-radar-panel-strong" />
                  <div className="h-3 w-16 animate-pulse rounded-sm bg-radar-panel-strong" />
                </div>
                <div className="mt-3 h-4 w-[84%] animate-pulse rounded-sm bg-radar-panel-strong" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded-sm bg-radar-panel-strong" />
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <article
            key={`stat-skeleton-${index}`}
            className="grid gap-3 rounded-sm border border-radar-border/70 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur sm:grid-cols-[minmax(0,1fr)_96px] sm:items-center"
          >
            <div>
              <div className="h-3 w-36 animate-pulse rounded-sm bg-radar-panel-muted" />
              <div className="mt-3 h-10 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
              <div className="mt-3 h-4 w-[88%] animate-pulse rounded-sm bg-radar-panel-muted" />
            </div>
            <div className="flex h-12 w-24 items-end gap-1 bg-radar-panel-muted p-1">
              <span className="h-8 flex-1 animate-pulse bg-radar-panel-strong" />
              <span className="h-4 flex-1 animate-pulse bg-radar-panel-strong" />
              <span className="h-6 flex-1 animate-pulse bg-radar-panel-strong" />
              <span className="h-10 flex-1 animate-pulse bg-radar-panel-strong" />
              <span className="h-5 flex-1 animate-pulse bg-radar-panel-strong" />
            </div>
          </article>
        ))}
      </div>

      <article className="overflow-hidden rounded-sm border border-radar-border/70 bg-[rgba(12,14,18,0.82)] shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 border-b border-radar-border/60 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full max-w-[64ch]">
            <div className="h-8 w-96 max-w-full animate-pulse rounded-sm bg-radar-panel-muted" />
            <div className="mt-4 h-4 w-[90%] animate-pulse rounded-sm bg-radar-panel-muted" />
            <div className="mt-2 h-4 w-[74%] animate-pulse rounded-sm bg-radar-panel-muted" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-9 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
            <div className="h-9 w-32 animate-pulse rounded-sm bg-radar-panel-muted" />
          </div>
        </div>
        <div className="min-h-[332px] overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="bg-radar-panel-muted">
                {Array.from({ length: 5 }, (_, index) => (
                  <th
                    key={`head-skeleton-${index}`}
                    className="px-4 py-4 text-left"
                  >
                    <div className="h-3 w-20 animate-pulse rounded-sm bg-radar-panel-strong" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }, (_, index) => (
                <tr
                  key={`matrix-skeleton-${index}`}
                  className="border-b border-radar-border-soft"
                >
                  <td className="px-4 py-4">
                    <div className="h-4 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-4 w-[88%] animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-3">
                      <div className="h-1.5 w-24 animate-pulse rounded-full bg-radar-panel-muted" />
                      <div className="h-4 w-12 animate-pulse rounded-sm bg-radar-panel-muted" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="h-7 w-28 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="ml-auto h-7 w-7 animate-pulse rounded-sm bg-radar-panel-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

import { useI18n } from "@/shared/i18n/i18n-provider";

export function FeedPagination({
  pagination,
  busy,
  statusLabel,
  onPageChange,
}: {
  pagination: { page: number; totalPages: number };
  busy: boolean;
  statusLabel: string;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const { page, totalPages } = pagination;
  const previousUnavailable = busy || page <= 1;
  const nextUnavailable = busy || page >= totalPages || page >= 10000;
  const button =
    "min-h-11 rounded-sm border border-radar-border px-4 text-sm text-radar-copy transition hover:border-radar-primary aria-disabled:opacity-40 aria-disabled:focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-radar-primary forced-colors:focus-visible:outline-[CanvasText]";
  return (
    <nav
      aria-label={t("feed.pagination")}
      aria-busy={busy}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-radar-copy/70">{statusLabel}</p>
      <div className="flex gap-2">
        <button
          className={button}
          type="button"
          aria-disabled={previousUnavailable}
          tabIndex={previousUnavailable ? -1 : undefined}
          onClick={() => {
            if (!previousUnavailable) onPageChange(page - 1);
          }}
        >
          {t("feed.previous")}
        </button>
        <button
          className={button}
          type="button"
          aria-disabled={nextUnavailable}
          tabIndex={nextUnavailable ? -1 : undefined}
          onClick={() => {
            if (!nextUnavailable) onPageChange(page + 1);
          }}
        >
          {t("feed.next")}
        </button>
      </div>
    </nav>
  );
}

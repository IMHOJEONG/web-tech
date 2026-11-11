import { useI18n } from "@/shared/i18n/i18n-provider";

export function FeedPagination({
  pagination,
  busy,
  onPageChange,
}: {
  pagination: { page: number; total: number; totalPages: number };
  busy: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const { page, total, totalPages } = pagination;
  const button =
    "min-h-11 rounded-sm border border-radar-border px-4 text-sm text-radar-copy transition hover:border-radar-primary disabled:opacity-40";
  return (
    <nav
      aria-label={t("feed.pagination")}
      aria-busy={busy}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p role="status" className="text-sm text-radar-copy/70">
        {t("feed.pageStatus")
          .replace("{{page}}", String(page))
          .replace("{{pages}}", String(Math.max(1, totalPages)))
          .replace("{{total}}", String(total))}
      </p>
      <div className="flex gap-2">
        <button
          className={button}
          type="button"
          disabled={busy || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("feed.previous")}
        </button>
        <button
          className={button}
          type="button"
          disabled={busy || page >= totalPages || page >= 10000}
          onClick={() => onPageChange(page + 1)}
        >
          {t("feed.next")}
        </button>
      </div>
    </nav>
  );
}

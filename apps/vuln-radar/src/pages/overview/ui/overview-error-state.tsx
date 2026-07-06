import { ApiError } from "@/shared/api/client";
import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

interface OverviewErrorStateProps {
  errorDetails: Array<{
    label: string;
    code: string;
    status: number | null;
    message: string;
  }>;
  onRetry: () => void | Promise<void>;
}

export function OverviewErrorState({
  errorDetails,
  onRetry,
}: OverviewErrorStateProps) {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-6">
      <article className="rounded-sm border border-radar-border/60 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur">
        <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
          {t("overview.errorEyebrow")}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
          {t("overview.errorTitle")}
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-6 text-radar-copy/72">
          {t("overview.errorBody")}{" "}
          <code>{runtimeConfig.apiBasePath}/health</code>
        </p>
        <ul className="mt-5 grid gap-3">
          {errorDetails.map((item) => (
            <li
              key={item.label}
              className="grid gap-1 rounded-sm border border-radar-border-soft bg-radar-panel-strong px-4 py-4"
            >
              <strong className="font-mono text-sm text-white">
                {item.label}
              </strong>
              <span className="text-sm text-radar-copy/72">
                {item.code}
                {item.status ? ` / ${item.status}` : ""}
                {` - ${item.message}`}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="mt-5 inline-flex min-h-10 items-center justify-center rounded-sm border border-radar-primary/26 bg-radar-critical/10 px-4 text-sm font-medium text-radar-primary transition hover:-translate-y-px hover:bg-radar-critical/15 hover:shadow-[0_0_14px_rgba(255,82,95,0.14)]"
          onClick={() => void onRetry()}
        >
          {t("common.retry")}
        </button>
      </article>
    </section>
  );
}

export function mapQueryError(label: string, queryError: unknown) {
  if (queryError instanceof ApiError) {
    return {
      label,
      code: queryError.code,
      status: queryError.status,
      message: queryError.message,
    };
  }

  return {
    label,
    code: "unknown",
    status: null,
    message:
      queryError instanceof Error
        ? queryError.message
        : "Unknown query failure.",
  };
}

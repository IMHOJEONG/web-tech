import { runtimeConfig } from "@/shared/config/runtime";
import { useI18n } from "@/shared/i18n/i18n-provider";

export function OverviewLoadingState() {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid w-full max-w-[1280px] gap-6">
      <article className="rounded-sm border border-radar-border/60 bg-radar-panel px-5 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] backdrop-blur">
        <p className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em] text-radar-copy/70">
          {t("overview.loadingEyebrow")}
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
          {t("overview.loadingTitle")}
        </h2>
        <p className="mt-3 max-w-[62ch] text-sm leading-6 text-radar-copy/72">
          {t("overview.loadingBody")} <code>{runtimeConfig.apiBasePath}</code>
        </p>
      </article>
    </section>
  );
}

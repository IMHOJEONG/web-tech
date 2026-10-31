import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import { journalEyebrow } from '~/shared/ui/journal-layout'

export async function LandingHero() {
    const t = await getTranslations('rootLanding')

    return (
        <section
            data-testid="landing-introduction"
            className="space-y-5 border-b border-border pb-8"
        >
            <p className={journalEyebrow}>{t('hero.eyebrow')}</p>
            <div className="max-w-3xl space-y-3">
                <h1 className="font-display break-keep text-3xl font-bold leading-tight tracking-tight text-on-surface [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
                    {t('hero.title')}
                </h1>
                <p className="max-w-2xl break-keep text-sm leading-7 text-on-surface-variant sm:text-base">
                    {t('hero.description')}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/docs"
                    className="ds-button-primary ds-focus-ring min-h-11 px-5 py-2.5 text-sm"
                >
                    {t('hero.primaryCta')}
                </Link>
                <Link
                    href="/about"
                    className="ds-focus-ring inline-flex min-h-11 items-center rounded-sm px-2 text-sm text-on-surface-variant underline underline-offset-4 hover:text-[var(--docs-interactive-text)]"
                >
                    {t('hero.secondaryCta')}
                </Link>
            </div>
        </section>
    )
}

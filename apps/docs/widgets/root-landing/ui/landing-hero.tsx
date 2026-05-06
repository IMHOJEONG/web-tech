import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'

export async function LandingHero() {
    const locale = await getLocale()
    const t = await getTranslations('rootLanding')
    const isKorean = locale.startsWith('ko')

    return (
        <section className="border-b border-outline-variant/70">
            <div className="mx-auto grid w-full max-w-page gap-12 px-4 py-12 sm:px-6 sm:py-16 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.35fr)] lg:items-end lg:gap-10 lg:py-20">
                <div className="space-y-7">
                    <div className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
                        <span className="inline-block size-2 rounded-full bg-primary" />
                        <span>{t('hero.eyebrow')}</span>
                    </div>

                    <div className="space-y-3">
                        <h1
                            lang={isKorean ? 'ko' : undefined}
                            className={`max-w-5xl text-5xl font-semibold text-on-surface sm:text-6xl lg:text-7xl ${
                                isKorean
                                    ? 'break-keep leading-[1.02] tracking-[-0.03em]'
                                    : 'leading-[0.92] tracking-tighter'
                            }`}
                        >
                            <span className="block">
                                {t('hero.titleLineOne')}
                            </span>
                            <span className="block text-primary">
                                {t('hero.titleLineTwo')}
                            </span>
                            <span className="block">
                                {t('hero.titleLineThree')}
                            </span>
                        </h1>

                        <p
                            lang={isKorean ? 'ko' : undefined}
                            className={`max-w-3xl text-base leading-8 text-on-surface-variant sm:text-lg ${
                                isKorean ? 'break-keep' : ''
                            }`}
                        >
                            {t('hero.description')}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link href="/feed" className="ds-button-primary">
                            {t('hero.primaryCta')}
                        </Link>
                        <Link href="/about" className="ds-outline-button">
                            {t('hero.secondaryCta')}
                        </Link>
                    </div>
                </div>

                <div className="ds-panel-muted space-y-4 p-5 sm:p-6 lg:text-right">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                            {t('hero.metaLabel')}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                            {t('hero.metaValue')}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                            {t('hero.statusLabel')}
                        </p>
                        <p className="text-sm text-on-surface-variant">
                            {t('hero.statusValue')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

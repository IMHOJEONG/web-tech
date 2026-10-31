import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { AboutAuthor } from './about-author'
import { PushSubscriptionPanel } from '~/feature/web-push/ui/push-subscription-panel'
import { journalPageLayout } from '~/shared/ui/journal-layout'

function PillBadge({
    label,
    tone,
}: {
    label: string
    tone: 'primary' | 'secondary' | 'muted'
}) {
    const className =
        tone === 'primary'
            ? 'bg-primary/10 text-primary'
            : tone === 'secondary'
              ? 'bg-secondary/15 text-secondary'
              : 'bg-surface-container text-on-surface-variant'

    return (
        <div
            className={`font-display inline-flex rounded-full px-3 py-1 text-xs uppercase ${className}`}
        >
            {label}
        </div>
    )
}

export async function AboutUs() {
    const t = await getTranslations('about')

    const pillarCards = [
        {
            eyebrow: t('pillars.web.eyebrow'),
            title: t('pillars.web.title'),
            description: t('pillars.web.description'),
            tone: 'secondary' as const,
        },
        {
            eyebrow: t('pillars.mobile.eyebrow'),
            title: t('pillars.mobile.title'),
            description: t('pillars.mobile.description'),
            tone: 'primary' as const,
            terminal: [
                t('pillars.mobile.terminalLineOne'),
                t('pillars.mobile.terminalLineTwo'),
            ],
        },
        {
            eyebrow: t('pillars.design.eyebrow'),
            title: t('pillars.design.title'),
            description: t('pillars.design.description'),
            tone: 'muted' as const,
        },
    ]

    return (
        <MainContent className={`${journalPageLayout} text-on-surface`}>
            <div className="space-y-7">
                <section className="border-b border-border pb-8">
                    <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)] lg:items-end">
                        <div className="max-w-4xl space-y-4">
                            <p className="font-display text-xs font-semibold tracking-wide text-on-surface-variant">
                                {t('hero.eyebrow')}
                            </p>

                            <div className="space-y-3">
                                <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-on-surface sm:text-4xl">
                                    {t('hero.titleLead')}{' '}
                                    <span className="text-primary">
                                        {t('hero.titleAccentOne')}
                                    </span>{' '}
                                    <span className="text-primary">
                                        {t('hero.titleAccentTwo')}
                                    </span>
                                </h1>
                                <p className="max-w-3xl break-keep text-sm leading-7 text-on-surface-variant sm:text-base">
                                    {t('hero.description')}
                                </p>
                            </div>
                        </div>

                        <aside className="border-l-2 border-border pl-5">
                            <p className="font-display text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                                {t('hero.asideTitle')}
                            </p>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
                                <p>{t('hero.missionLabel')}</p>
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    {pillarCards.map((card, index) => (
                        <article
                            key={card.title}
                            className="border-t border-border py-5"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <PillBadge
                                    label={card.eyebrow}
                                    tone={card.tone}
                                />
                                <span className="font-display text-xs font-semibold tracking-[0.16em] text-outline">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </div>
                            <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-on-surface">
                                {card.title}
                            </h2>
                            <p className="mt-3 line-clamp-4 text-sm leading-6 text-on-surface-variant">
                                {card.description}
                            </p>
                            {card.terminal && (
                                <div className="mt-4 rounded-2xl border border-border bg-surface-container p-3 font-mono text-[0.75rem] leading-5 text-primary">
                                    <p>{card.terminal[0]}</p>
                                    <p>{card.terminal[1]}</p>
                                </div>
                            )}
                        </article>
                    ))}
                </section>

                <AboutAuthor />
                {process.env.BLOG_PUSH_ENABLED === 'true' && (
                    <PushSubscriptionPanel />
                )}
            </div>
        </MainContent>
    )
}

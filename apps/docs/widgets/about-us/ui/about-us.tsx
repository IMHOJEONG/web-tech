import { getTranslations } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

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
    const githubHref = t('profile.links.github.href')
    const twitterHref = t('profile.links.twitter.href')

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
        <main className="docs-shell px-4 py-8 text-on-surface sm:px-6 sm:py-10 lg:px-8">
            <div className="space-y-7">
                <section className="ds-panel relative overflow-hidden p-5 sm:p-6 lg:p-7">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,107,31,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.1),transparent_34%)]" />
                    <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)] lg:items-end">
                        <div className="max-w-4xl space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-primary">
                                <span className="size-2 rounded-full bg-current" />
                                <span className="font-display text-xs font-semibold tracking-[0.16em] uppercase">
                                    {t('hero.status')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-4xl lg:text-[2.7rem]">
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

                        <aside className="rounded-3xl border border-border bg-surface-container-lowest/85 p-4 backdrop-blur">
                            <p className="font-display text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                                {t('hero.asideTitle')}
                            </p>
                            <div className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
                                <p>{t('hero.missionLabel')}</p>
                                <p>{t('hero.establishedLabel')}</p>
                            </div>
                        </aside>
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    {pillarCards.map((card, index) => (
                        <article
                            key={card.title}
                            className="rounded-3xl border border-border bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-deep"
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

                <section className="grid gap-4 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:items-stretch">
                    <article className="rounded-3xl border border-border bg-surface-container-lowest p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-display text-xl font-bold tracking-tight text-on-surface">
                                    {t('profile.name')}
                                </h2>
                                <p className="mt-1 font-display text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                    {t('profile.role')}
                                </p>
                            </div>
                            <ArrowUpRight className="size-5 shrink-0 text-primary" />
                        </div>

                        <p className="mt-5 text-sm leading-7 text-on-surface-variant">
                            {t('profile.bio')}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {githubHref ? (
                                <a
                                    href={githubHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ds-button-secondary gap-2 px-4 py-2 text-sm"
                                >
                                    <FaGithub className="size-4" />
                                    {t('profile.links.github.label')}
                                </a>
                            ) : null}
                            {twitterHref ? (
                                <a
                                    href={twitterHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ds-button-secondary gap-2 px-4 py-2 text-sm"
                                >
                                    <FaXTwitter className="size-4" />
                                    {t('profile.links.twitter.label')}
                                </a>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container px-4 py-2 text-sm text-on-surface-variant">
                                    <FaXTwitter className="size-4" />
                                    {t('profile.links.twitter.label')}
                                </span>
                            )}
                        </div>
                    </article>

                    <article className="relative overflow-hidden rounded-3xl border border-border bg-surface-container-lowest p-5">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,107,31,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_36%)]" />
                        <div className="relative grid h-full gap-3 sm:grid-cols-3">
                            {pillarCards.map((card) => (
                                <div
                                    key={card.eyebrow}
                                    className="flex min-h-32 flex-col justify-between rounded-2xl border border-border/80 bg-background/70 p-4"
                                >
                                    <p className="font-display text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                                        {card.eyebrow}
                                    </p>
                                    <p className="mt-6 text-sm font-semibold leading-6 text-on-surface">
                                        {card.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </article>
                </section>
            </div>
        </main>
    )
}

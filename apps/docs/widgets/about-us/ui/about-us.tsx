import { getTranslations } from 'next-intl/server'
import { ArrowUpRight } from 'lucide-react'
import { FaGithub } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { ContactForm } from './contact-form'

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

    const webCard = pillarCards[0]!
    const mobileCard = pillarCards[1]!
    const designCard = pillarCards[2]!

    return (
        <main className="w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
            <div className="mx-auto flex w-full max-w-page flex-col gap-24 px-4 pb-24 pt-32 sm:px-8">
                <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="min-w-0 max-w-4xl space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="size-2 rounded-full bg-current" />
                            <span className="font-display text-sm font-medium tracking-wider uppercase">
                                {t('hero.status')}
                            </span>
                        </div>

                        <h1 className="font-display max-w-[13ch] text-[clamp(2.75rem,6vw,4.75rem)] leading-[1.05] font-bold tracking-[-0.04em] text-on-surface">
                            {t('hero.titleLead')}{' '}
                            <span className="text-secondary">
                                {t('hero.titleAccentOne')}
                            </span>{' '}
                            <span className="text-secondary">
                                {t('hero.titleAccentTwo')}
                            </span>
                        </h1>

                        <p className="max-w-2xl break-keep text-body-lg text-on-surface-variant">
                            {t('hero.description')}
                        </p>
                    </div>

                    <div className="font-mono text-sm leading-normal text-outline lg:shrink-0 lg:text-right">
                        <p>{t('hero.missionLabel')}</p>
                        <p>{t('hero.establishedLabel')}</p>
                    </div>
                </section>

                <section className="grid grid-cols-12 gap-6">
                    <article className="ds-card col-span-12 flex min-h-88 flex-col justify-between bg-surface-container-low p-12 lg:col-span-8">
                        <div className="space-y-4">
                            <PillBadge
                                label={webCard.eyebrow}
                                tone="secondary"
                            />
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {webCard.title}
                            </h2>
                            <p className="max-w-128 text-body-md text-on-surface-variant">
                                {webCard.description}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-primary">
                            <ArrowUpRight className="size-6" />
                            <FaGithub className="size-5 text-outline" />
                        </div>
                    </article>

                    <article className="ds-card col-span-12 flex min-h-88 flex-col justify-between bg-surface-container-low p-12 lg:col-span-4">
                        <div className="space-y-4">
                            <PillBadge
                                label={mobileCard.eyebrow}
                                tone="primary"
                            />
                            <h2 className="font-display text-headline-md text-on-surface">
                                {mobileCard.title}
                            </h2>
                            <p className="text-body-md text-on-surface-variant">
                                {mobileCard.description}
                            </p>
                        </div>

                        <div className="rounded-sm border border-border bg-surface-container p-4 font-mono text-xs leading-4 text-secondary">
                            <p>{mobileCard.terminal?.[0]}</p>
                            <p>{mobileCard.terminal?.[1]}</p>
                        </div>
                    </article>

                    <article className="ds-card col-span-12 grid min-h-76 bg-surface-container-low p-12 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:gap-8">
                        <div className="space-y-4">
                            <PillBadge
                                label={designCard.eyebrow}
                                tone="muted"
                            />
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {designCard.title}
                            </h2>
                            <p className="max-w-2xl text-body-md text-on-surface-variant">
                                {designCard.description}
                            </p>
                        </div>

                        <div className="mt-8 overflow-hidden rounded-sm border border-border lg:mt-0">
                            <div className="aspect-video bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_35%),linear-gradient(135deg,color-mix(in_srgb,var(--surface-bright)_90%,transparent),color-mix(in_srgb,var(--surface-container)_82%,transparent))]" />
                        </div>
                    </article>
                </section>

                <section className="grid gap-16 pt-8 lg:grid-cols-2">
                    <article className="ds-card relative bg-surface-container p-8 shadow-glow-primary">
                        <div className="space-y-8">
                            <div className="flex items-center gap-6">
                                <div className="flex size-20 items-center justify-center rounded-xl border-2 border-primary bg-[linear-gradient(135deg,var(--surface-container-low),var(--surface-container-high))] text-2xl font-bold text-primary">
                                    AV
                                </div>
                                <div className="space-y-1">
                                    <h2 className="font-display text-[1.5rem] leading-[1.3] font-bold text-on-surface">
                                        {t('profile.name')}
                                    </h2>
                                    <p className="font-display text-base tracking-wider uppercase text-primary">
                                        {t('profile.role')}
                                    </p>
                                </div>
                            </div>

                            <p className="text-body-md text-on-surface-variant">
                                {t('profile.bio')}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="#"
                                    className="ds-button-secondary gap-2 px-4 py-2 text-sm"
                                >
                                    <FaGithub className="size-4" />
                                    {t('profile.github')}
                                </a>
                                <a
                                    href="#"
                                    className="ds-button-secondary gap-2 px-4 py-2 text-sm"
                                >
                                    <FaXTwitter className="size-4" />
                                    {t('profile.twitter')}
                                </a>
                            </div>
                        </div>
                    </article>

                    <section className="space-y-12">
                        <div className="border-l-4 border-primary pl-7">
                            <h2 className="font-display text-headline-lg text-on-surface">
                                {t('contact.title')}
                            </h2>
                            <p className="mt-2 text-body-md text-on-surface-variant">
                                {t('contact.description')}
                            </p>
                        </div>

                        <ContactForm />
                    </section>
                </section>
            </div>
        </main>
    )
}

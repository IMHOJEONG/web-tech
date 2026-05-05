'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LandingBox } from './landing-box'

export const HeroSection = () => {
    const t = useTranslations('home')
    const previewCards = [
        {
            accent: '01',
            title: t('preview.cards.web.title'),
            description: t('preview.cards.web.description'),
            href: '/web',
        },
        {
            accent: '02',
            title: t('preview.cards.mobile.title'),
            description: t('preview.cards.mobile.description'),
            href: '/mobile',
        },
        {
            accent: '03',
            title: t('preview.cards.system.title'),
            description: t('preview.cards.system.description'),
            href: '/category',
        },
    ]
    const topics = [
        t('preview.topics.architecture'),
        t('preview.topics.uiux'),
        t('preview.topics.designSystem'),
        t('preview.topics.infrastructure'),
    ]

    return (
        <LandingBox>
            <section className="grid items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                <div className="flex flex-col justify-center gap-5">
                    <div className="inline-flex w-fit items-center rounded-full border border-zinc-300/80 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-zinc-600 uppercase shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                        {t('preview.eyebrow')}
                    </div>
                    <h1 className="bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-400 bg-clip-text text-5xl font-extrabold leading-tight tracking-tight text-transparent dark:from-white dark:via-zinc-200 dark:to-zinc-500 md:text-6xl">
                        {t('title')}
                    </h1>
                    <div
                        lang="ko"
                        className="max-w-2xl text-balance text-base leading-7 text-zinc-500 dark:text-zinc-400 md:text-lg"
                    >
                        {t('description')}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {topics.map((topic) => (
                            <span
                                key={topic}
                                className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-[32px] border border-zinc-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(161,161,170,0.18),_transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,244,245,0.9))] p-5 shadow-[0_24px_80px_rgba(24,24,27,0.12)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_right,_rgba(113,113,122,0.2),_transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))]">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">
                                {t('preview.panelLabel')}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                {t('preview.panelDescription')}
                            </p>
                        </div>
                        <div className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
                            {t('preview.panelBadge')}
                        </div>
                    </div>
                    <div className="space-y-3">
                        {previewCards.map((card) => (
                            <Link
                                key={card.accent}
                                href={card.href}
                                className="group block rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/75 dark:hover:border-zinc-700"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-bold text-white transition-colors group-hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-zinc-300">
                                        {card.accent}
                                    </div>
                                    <div className="flex flex-1 items-center justify-between gap-3">
                                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 md:text-base">
                                            {card.title}
                                        </h2>
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                                            {t('preview.linkLabel')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                    {card.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </LandingBox>
    )
}

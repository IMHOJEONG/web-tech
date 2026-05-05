import { getTime } from '@web-tech/ui/lib/time'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { SearchData } from '~/lib/get-search-data'

type DocsIndexProps = {
    docs: SearchData[]
    recommendations: string[]
    keyword?: string
}

const SECTION_ORDER = [
    'Web',
    'UI/UX',
    'Backend',
    'Computer Science',
    'Docs',
] as const

type SectionKey = (typeof SECTION_ORDER)[number]

const SECTION_HREFS: Record<SectionKey, string> = {
    Web: '/web',
    'UI/UX': '/ui-ux',
    Backend: '/category/be',
    'Computer Science': '/category/computer-science',
    Docs: '/docs',
}

function getSectionMessageKey(section: SectionKey) {
    switch (section) {
        case 'Web':
            return 'web'
        case 'UI/UX':
            return 'uiux'
        case 'Backend':
            return 'backend'
        case 'Computer Science':
            return 'computerscience'
        case 'Docs':
            return 'docs'
    }
}

function getSectionSummary(docs: SearchData[]) {
    const counts = new Map<string, number>()
    const latestDates = new Map<string, string>()

    docs.forEach((doc) => {
        const currentCount = counts.get(doc.section) ?? 0
        counts.set(doc.section, currentCount + 1)

        if (!latestDates.has(doc.section) && doc.date) {
            latestDates.set(doc.section, doc.date)
        }
    })

    return SECTION_ORDER.filter((section) => counts.has(section)).map(
        (section) => ({
            key: section,
            href: SECTION_HREFS[section],
            count: counts.get(section) ?? 0,
            latest: latestDates.get(section),
        })
    )
}

async function DocsIndexCard({ doc }: { doc: SearchData }) {
    const t = await getTranslations('docsIndex')

    return (
        <Link
            href={doc.href}
            className="group rounded-3xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,24,27,0.05)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_20px_48px_rgba(24,24,27,0.08)] dark:border-zinc-800 dark:bg-zinc-950/90 dark:hover:border-zinc-700"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {getTime(doc.date)}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-zinc-900 transition-colors group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-200">
                            {doc.title ?? doc.slug}
                        </h3>
                        {doc.summary && (
                            <p className="line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                {doc.summary}
                            </p>
                        )}
                    </div>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                    {t('card.open')}
                </span>
            </div>
        </Link>
    )
}

export async function DocsIndex({
    docs,
    recommendations,
    keyword,
}: DocsIndexProps) {
    const t = await getTranslations('docsIndex')
    const sectionSummary = getSectionSummary(docs)
    const latestUpdated = docs[0]?.date ? getTime(docs[0].date) : null

    if (keyword) {
        return (
            <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="space-y-8">
                    <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                {t('search.eyebrow')}
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                                {t('search.title', { keyword })}
                            </h1>
                            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                                {t('search.description')}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                    {t('search.countLabel', {
                                        count: docs.length,
                                    })}
                                </span>
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                    {t('search.matchingEyebrow')}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {t('search.matchingTitle')}
                                </h2>
                            </div>
                            <Link
                                href="/docs"
                                className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                            >
                                {t('search.backToDocs')}
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {docs.map((doc) => (
                                <DocsIndexCard key={doc.id} doc={doc} />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-8">
                <section className="rounded-[28px] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.92))] p-6 shadow-[0_20px_60px_rgba(24,24,27,0.06)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))] sm:p-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                {t('index.eyebrow')}
                            </p>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                                    {t('index.title')}
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
                                    {t('index.description')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    {t('stats.totalDocs')}
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {docs.length}
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    {t('stats.sections')}
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {sectionSummary.length}
                                </p>
                            </div>
                            <div className="rounded-[22px] border border-zinc-200 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                    {t('stats.latestUpdate')}
                                </p>
                                <p className="mt-3 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {latestUpdated ?? t('stats.pending')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                {t('sections.eyebrow')}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                {t('sections.title')}
                            </h2>
                        </div>
                        <Link
                            href="/category"
                            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            {t('sections.toCategory')}
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {sectionSummary.map((section) => {
                            const sectionKey = getSectionMessageKey(section.key)

                            return (
                                <Link
                                    key={section.key}
                                    href={section.href}
                                    className="group rounded-3xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_16px_40px_rgba(24,24,27,0.04)] transition-all hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/90 dark:hover:border-zinc-700"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                                {t(
                                                    `sectionLabels.${sectionKey}`
                                                )}
                                            </p>
                                            <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                                {t('sections.documentCount', {
                                                    count: section.count,
                                                })}
                                            </h3>
                                            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                                                {t(
                                                    `sectionDescriptions.${sectionKey}`
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                                                {t('card.open')}
                                            </span>
                                            {section.latest && (
                                                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                    최근{' '}
                                                    {getTime(section.latest)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                {t('allDocuments.eyebrow')}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                {t('allDocuments.title')}
                            </h2>
                        </div>
                        <Link
                            href="/feed"
                            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        >
                            {t('allDocuments.toFeed')}
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {docs.map((doc) => (
                            <DocsIndexCard key={doc.id} doc={doc} />
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}

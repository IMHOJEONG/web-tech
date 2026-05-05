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
            className="group ds-card bg-surface-container-lowest p-5 hover:-translate-y-0.5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="ds-chip-muted px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.18em]">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <span className="text-xs text-outline">
                                {getTime(doc.date)}
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-[-0.02em] text-on-surface transition-colors group-hover:text-primary">
                            {doc.title ?? doc.slug}
                        </h3>
                        {doc.summary && (
                            <p className="line-clamp-3 text-sm leading-6 text-on-surface-variant">
                                {doc.summary}
                            </p>
                        )}
                    </div>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-outline transition-colors group-hover:text-primary">
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
                    <section className="ds-panel p-6 sm:p-8">
                        <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                                {t('search.eyebrow')}
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                                {t('search.title', { keyword })}
                            </h1>
                            <p className="text-sm leading-7 text-on-surface-variant sm:text-base">
                                {t('search.description')}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                <span className="ds-chip-muted px-3 py-1 text-xs font-medium normal-case tracking-normal">
                                    {t('search.countLabel', {
                                        count: docs.length,
                                    })}
                                </span>
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="ds-chip-muted px-3 py-1 text-xs font-medium normal-case tracking-normal hover:border-primary hover:text-primary"
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
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                                    {t('search.matchingEyebrow')}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                                    {t('search.matchingTitle')}
                                </h2>
                            </div>
                            <Link
                                href="/docs"
                                className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
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
                <section className="ds-panel p-6 sm:p-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
                        <div className="space-y-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                                {t('index.eyebrow')}
                            </p>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                                    {t('index.title')}
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                                    {t('index.description')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {recommendations.map((term) => (
                                    <Link
                                        key={term}
                                        href={`/docs?q=${encodeURIComponent(term)}`}
                                        className="ds-chip-muted px-3 py-1 text-xs font-medium normal-case tracking-normal hover:border-primary hover:text-primary"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            <div className="ds-panel-muted p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                                    {t('stats.totalDocs')}
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-on-surface">
                                    {docs.length}
                                </p>
                            </div>
                            <div className="ds-panel-muted p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                                    {t('stats.sections')}
                                </p>
                                <p className="mt-3 text-3xl font-bold tracking-tight text-on-surface">
                                    {sectionSummary.length}
                                </p>
                            </div>
                            <div className="ds-panel-muted p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                                    {t('stats.latestUpdate')}
                                </p>
                                <p className="mt-3 text-lg font-semibold tracking-tight text-on-surface">
                                    {latestUpdated ?? t('stats.pending')}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                                {t('sections.eyebrow')}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                                {t('sections.title')}
                            </h2>
                        </div>
                        <Link
                            href="/category"
                            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
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
                                    className="group ds-card bg-surface-container-lowest p-5 hover:-translate-y-0.5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-outline">
                                                {t(
                                                    `sectionLabels.${sectionKey}`
                                                )}
                                            </p>
                                            <h3 className="text-xl font-semibold tracking-tight text-on-surface">
                                                {t('sections.documentCount', {
                                                    count: section.count,
                                                })}
                                            </h3>
                                            <p className="text-sm leading-6 text-on-surface-variant">
                                                {t(
                                                    `sectionDescriptions.${sectionKey}`
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-outline transition-colors group-hover:text-primary">
                                                {t('card.open')}
                                            </span>
                                            {section.latest && (
                                                <p className="mt-3 text-xs text-on-surface-variant">
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
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">
                                {t('allDocuments.eyebrow')}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                                {t('allDocuments.title')}
                            </h2>
                        </div>
                        <Link
                            href="/feed"
                            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
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

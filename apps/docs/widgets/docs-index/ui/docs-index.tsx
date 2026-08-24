import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import type { SearchData } from '~/lib/get-search-data'
import { buildSearchResultItem } from '~/lib/search-result-contract'

type DocsIndexProps = {
    docs: SearchData[]
    recommendations: readonly string[]
    currentPage?: number
    keyword?: string
}

const ALL_DOCS_PAGE_SIZE = 8

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

function clampPage(page: number, totalPages: number) {
    if (!Number.isFinite(page) || page < 1) {
        return 1
    }

    return Math.min(Math.trunc(page), totalPages)
}

function getDocsPageHref(page: number) {
    if (page <= 1) {
        return '/docs'
    }

    return `/docs?page=${page}`
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

async function DocsIndexCard({
    doc,
    keyword,
}: {
    doc: SearchData
    keyword?: string
}) {
    const t = await getTranslations('docsIndex')
    const resultItem = buildSearchResultItem(doc, keyword)

    return (
        <Link
            href={doc.href}
            className="group block rounded-2xl border border-border bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-deep"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-display text-[0.68rem] font-semibold tracking-[0.16em] text-primary uppercase">
                            {doc.section}
                        </span>
                        {doc.date && (
                            <>
                                <span className="text-xs text-outline">/</span>
                                <span className="text-xs text-outline">
                                    {getTime(doc.date)}
                                </span>
                            </>
                        )}
                    </div>
                    <h3
                        className="text-base font-semibold tracking-[-0.02em] text-on-surface transition-colors group-hover:text-primary sm:text-lg [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                        dangerouslySetInnerHTML={{
                            __html: resultItem.preview.titleHtml,
                        }}
                    />
                    {(keyword || doc.summary) && (
                        <p
                            className="line-clamp-2 text-sm leading-6 text-on-surface-variant [&_.search-highlight]:rounded-sm [&_.search-highlight]:bg-primary-container/70 [&_.search-highlight]:px-1 [&_.search-highlight]:py-px [&_.search-highlight]:font-medium [&_.search-highlight]:text-on-primary-container dark:[&_.search-highlight]:bg-primary/18 dark:[&_.search-highlight]:text-primary-fixed"
                            dangerouslySetInnerHTML={{
                                __html: resultItem.preview.excerptHtml,
                            }}
                        />
                    )}
                </div>
                <span className="shrink-0 self-start rounded-full border border-border px-3 py-1.5 font-display text-[0.65rem] font-semibold tracking-[0.14em] text-outline uppercase transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    {t('card.open')}
                </span>
            </div>
        </Link>
    )
}

function DocsSearchPanel({
    keyword,
    eyebrow,
    title,
    description,
    placeholder,
    submitLabel,
    recommendations,
    resultCount,
}: {
    keyword?: string
    eyebrow: string
    title: string
    description: string
    placeholder: string
    submitLabel: string
    recommendations: readonly string[]
    resultCount?: string
}) {
    return (
        <section className="ds-panel overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-end">
                <div className="space-y-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                        {eyebrow}
                    </p>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl lg:text-4xl">
                            {title}
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                            {description}
                        </p>
                    </div>
                    {resultCount && (
                        <span className="inline-flex rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                            {resultCount}
                        </span>
                    )}
                </div>

                <div className="space-y-3">
                    <form
                        action="/docs"
                        className="flex overflow-hidden rounded-2xl border border-border bg-surface-container-lowest p-1.5 focus-within:border-primary/60 focus-within:shadow-glow-primary"
                    >
                        <input
                            name="q"
                            type="search"
                            defaultValue={keyword}
                            placeholder={placeholder}
                            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-fixed"
                        >
                            {submitLabel}
                        </button>
                    </form>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {recommendations.map((term) => (
                            <Link
                                key={term}
                                href={`/docs?q=${encodeURIComponent(term)}`}
                                className="shrink-0 rounded-full border border-border bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
                            >
                                {term}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export async function DocsIndex({
    docs,
    recommendations,
    currentPage = 1,
    keyword,
}: DocsIndexProps) {
    const t = await getTranslations('docsIndex')
    const sectionSummary = getSectionSummary(docs)
    const latestUpdated = docs[0]?.date ? getTime(docs[0].date) : null
    const allDocumentsTotalPages = Math.max(
        1,
        Math.ceil(docs.length / ALL_DOCS_PAGE_SIZE)
    )
    const allDocumentsCurrentPage = clampPage(
        currentPage,
        allDocumentsTotalPages
    )
    const allDocumentsStartIndex =
        (allDocumentsCurrentPage - 1) * ALL_DOCS_PAGE_SIZE
    const paginatedDocs = docs.slice(
        allDocumentsStartIndex,
        allDocumentsStartIndex + ALL_DOCS_PAGE_SIZE
    )
    const allDocumentsRangeStart =
        docs.length === 0 ? 0 : allDocumentsStartIndex + 1
    const allDocumentsRangeEnd = Math.min(
        docs.length,
        allDocumentsStartIndex + ALL_DOCS_PAGE_SIZE
    )

    if (keyword) {
        const formattedKeyword = formatSearchKeyword(keyword)

        return (
            <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="space-y-7">
                    <DocsSearchPanel
                        keyword={keyword}
                        eyebrow={t('search.eyebrow')}
                        title={t('search.title', {
                            keyword: formattedKeyword,
                        })}
                        description={t('search.description')}
                        placeholder={t('search.placeholder')}
                        submitLabel={t('search.submit')}
                        recommendations={recommendations}
                        resultCount={t('search.countLabel', {
                            count: docs.length,
                        })}
                    />

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
                        <div className="grid grid-cols-1 gap-3">
                            {docs.map((doc) => (
                                <DocsIndexCard
                                    key={doc.id}
                                    doc={doc}
                                    keyword={keyword}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-7">
                <DocsSearchPanel
                    eyebrow={t('index.eyebrow')}
                    title={t('index.title')}
                    description={t('index.description')}
                    placeholder={t('index.placeholder')}
                    submitLabel={t('index.submit')}
                    recommendations={recommendations}
                />

                <section className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-surface-container-lowest p-4">
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.totalDocs')}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                            {docs.length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-container-lowest p-4">
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.sections')}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                            {sectionSummary.length}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-container-lowest p-4">
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.latestUpdate')}
                        </p>
                        <p className="mt-2 text-base font-semibold tracking-tight text-on-surface">
                            {latestUpdated ?? t('stats.pending')}
                        </p>
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {sectionSummary.map((section) => {
                            const sectionKey = getSectionMessageKey(section.key)

                            return (
                                <Link
                                    key={section.key}
                                    href={section.href}
                                    className="group rounded-2xl border border-border bg-surface-container-lowest p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
                                >
                                    <p className="font-display text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                        {t(`sectionLabels.${sectionKey}`)}
                                    </p>
                                    <h3 className="mt-3 text-lg font-semibold tracking-tight text-on-surface">
                                        {t('sections.documentCount', {
                                            count: section.count,
                                        })}
                                    </h3>
                                    {section.latest && (
                                        <p className="mt-2 text-xs text-on-surface-variant">
                                            {t('sections.latestPrefix')}{' '}
                                            {getTime(section.latest)}
                                        </p>
                                    )}
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
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {t('allDocuments.pageSummary', {
                                    start: allDocumentsRangeStart,
                                    end: allDocumentsRangeEnd,
                                    total: docs.length,
                                })}
                            </p>
                        </div>
                        <Link
                            href="/feed"
                            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                        >
                            {t('allDocuments.toFeed')}
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {paginatedDocs.map((doc) => (
                            <DocsIndexCard key={doc.id} doc={doc} />
                        ))}
                    </div>
                    {allDocumentsTotalPages > 1 && (
                        <nav
                            aria-label={t('allDocuments.paginationAriaLabel')}
                            className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <Link
                                href={getDocsPageHref(
                                    allDocumentsCurrentPage - 1
                                )}
                                aria-disabled={allDocumentsCurrentPage === 1}
                                className={cn(
                                    'inline-flex items-center justify-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:text-primary',
                                    allDocumentsCurrentPage === 1 &&
                                        'pointer-events-none opacity-45'
                                )}
                            >
                                {t('allDocuments.previous')}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {Array.from(
                                    { length: allDocumentsTotalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <Link
                                        key={page}
                                        href={getDocsPageHref(page)}
                                        aria-current={
                                            page === allDocumentsCurrentPage
                                                ? 'page'
                                                : undefined
                                        }
                                        className={cn(
                                            'inline-flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition',
                                            page === allDocumentsCurrentPage
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary'
                                        )}
                                    >
                                        {page}
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={getDocsPageHref(
                                    allDocumentsCurrentPage + 1
                                )}
                                aria-disabled={
                                    allDocumentsCurrentPage ===
                                    allDocumentsTotalPages
                                }
                                className={cn(
                                    'inline-flex items-center justify-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:text-primary',
                                    allDocumentsCurrentPage ===
                                        allDocumentsTotalPages &&
                                        'pointer-events-none opacity-45'
                                )}
                            >
                                {t('allDocuments.next')}
                            </Link>
                        </nav>
                    )}
                </section>
            </div>
        </main>
    )
}

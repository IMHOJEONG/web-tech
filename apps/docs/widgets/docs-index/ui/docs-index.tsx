import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import type { SearchData } from '~/lib/get-search-data'
import {
    applyDocsIndexControls,
    filterDocsIndexControls,
    getDocsIndexHref,
    resolveDocsIndexControls,
    type DocsIndexControls,
} from '~/widgets/docs-index/model/docs-index-controls'
import {
    ALL_DOCS_PAGE_SIZE,
    getPaginationRange,
} from '~/widgets/docs-index/model/docs-index-pagination'
import {
    getDocsIndexSectionMessageKey,
    getDocsIndexSectionSummary,
} from '~/widgets/docs-index/model/docs-index-summary'
import { DocsIndexCard } from './docs-index-card'
import { DocsIndexControlsBar } from './docs-index-controls-bar'
import { DocsIndexEmptyState } from './docs-index-empty-state'
import { DocsSearchPanel } from './docs-search-panel'

type DocsIndexProps = {
    docs: SearchData[]
    recommendations: readonly string[]
    currentPage?: number
    controls?: DocsIndexControls
    keyword?: string
}

type MotionOrderStyle = CSSProperties & {
    '--motion-order': number
}

function getDocsPageHref(page: number, controls: DocsIndexControls) {
    return getDocsIndexHref({
        controls,
        page,
    })
}

function getMotionOrderStyle(index: number): MotionOrderStyle {
    return { '--motion-order': index }
}

export async function DocsIndex({
    docs,
    recommendations,
    currentPage = 1,
    controls,
    keyword,
}: DocsIndexProps) {
    const t = await getTranslations('docsIndex')
    const resolvedControls = controls ?? resolveDocsIndexControls({})
    const searchControls = { ...resolvedControls, sort: 'latest' as const }
    const visibleDocs = keyword
        ? filterDocsIndexControls(docs, searchControls)
        : applyDocsIndexControls(docs, resolvedControls)
    const sectionSummary = getDocsIndexSectionSummary(docs)
    const latestUpdated = docs[0]?.date ? getTime(docs[0].date) : null
    const pagination = getPaginationRange({
        currentPage,
        pageSize: ALL_DOCS_PAGE_SIZE,
        totalCount: visibleDocs.length,
    })
    const paginatedDocs = visibleDocs.slice(
        pagination.startIndex,
        pagination.startIndex + pagination.pageSize
    )

    if (keyword) {
        const formattedKeyword = formatSearchKeyword(keyword)

        return (
            <main className="docs-shell motion-layout px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
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
                            count: visibleDocs.length,
                        })}
                    />

                    <DocsIndexControlsBar
                        controls={searchControls}
                        keyword={keyword}
                        resultCount={visibleDocs.length}
                        showSort={false}
                    />

                    <section className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
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
                        {visibleDocs.length === 0 ? (
                            <DocsIndexEmptyState
                                controls={searchControls}
                                keyword={keyword}
                            />
                        ) : (
                            <div className="motion-layout grid grid-cols-1 gap-3">
                                {visibleDocs.map((doc, index) => (
                                    <DocsIndexCard
                                        key={doc.id}
                                        doc={doc}
                                        keyword={keyword}
                                        className="motion-reveal"
                                        style={getMotionOrderStyle(index)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        )
    }

    return (
        <main className="docs-shell motion-layout px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-7">
                <DocsSearchPanel
                    eyebrow={t('index.eyebrow')}
                    title={t('index.title')}
                    description={t('index.description')}
                    placeholder={t('index.placeholder')}
                    submitLabel={t('index.submit')}
                    recommendations={recommendations}
                />

                <section className="motion-layout grid gap-3 md:grid-cols-3">
                    <div
                        className="motion-layout motion-reveal rounded-2xl border border-border bg-surface-container-lowest p-4"
                        style={getMotionOrderStyle(0)}
                    >
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.totalDocs')}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                            {visibleDocs.length}
                        </p>
                    </div>
                    <div
                        className="motion-layout motion-reveal rounded-2xl border border-border bg-surface-container-lowest p-4"
                        style={getMotionOrderStyle(1)}
                    >
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.sections')}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                            {sectionSummary.length}
                        </p>
                    </div>
                    <div
                        className="motion-layout motion-reveal rounded-2xl border border-border bg-surface-container-lowest p-4"
                        style={getMotionOrderStyle(2)}
                    >
                        <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                            {t('stats.latestUpdate')}
                        </p>
                        <p className="mt-2 text-base font-semibold tracking-tight text-on-surface">
                            {latestUpdated ?? t('stats.pending')}
                        </p>
                    </div>
                </section>

                <DocsIndexControlsBar
                    controls={resolvedControls}
                    resultCount={visibleDocs.length}
                />

                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
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
                    <div className="motion-layout grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        {sectionSummary.map((section, index) => {
                            const sectionKey = getDocsIndexSectionMessageKey(
                                section.key
                            )

                            return (
                                <Link
                                    key={section.key}
                                    href={section.href}
                                    className="motion-layout motion-reveal group rounded-2xl border border-border bg-surface-container-lowest p-4 hover:-translate-y-0.5 hover:border-primary/40"
                                    style={getMotionOrderStyle(index)}
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
                            <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                                {t('allDocuments.eyebrow')}
                            </p>
                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                                {t('allDocuments.title')}
                            </h2>
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {t('allDocuments.pageSummary', {
                                    start: pagination.rangeStart,
                                    end: pagination.rangeEnd,
                                    total: visibleDocs.length,
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
                    {visibleDocs.length === 0 ? (
                        <DocsIndexEmptyState controls={resolvedControls} />
                    ) : (
                        <div className="motion-layout grid grid-cols-1 gap-3">
                            {paginatedDocs.map((doc, index) => (
                                <DocsIndexCard
                                    key={doc.id}
                                    doc={doc}
                                    className="motion-reveal"
                                    style={getMotionOrderStyle(index)}
                                />
                            ))}
                        </div>
                    )}
                    {pagination.totalPages > 1 && (
                        <nav
                            aria-label={t('allDocuments.paginationAriaLabel')}
                            className="motion-layout flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <Link
                                href={getDocsPageHref(
                                    pagination.page - 1,
                                    resolvedControls
                                )}
                                aria-disabled={pagination.page === 1}
                                className={cn(
                                    'inline-flex items-center justify-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:text-primary',
                                    pagination.page === 1 &&
                                        'pointer-events-none opacity-45'
                                )}
                            >
                                {t('allDocuments.previous')}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {Array.from(
                                    { length: pagination.totalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <Link
                                        key={page}
                                        href={getDocsPageHref(
                                            page,
                                            resolvedControls
                                        )}
                                        aria-current={
                                            page === pagination.page
                                                ? 'page'
                                                : undefined
                                        }
                                        className={cn(
                                            'inline-flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition',
                                            page === pagination.page
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
                                    pagination.page + 1,
                                    resolvedControls
                                )}
                                aria-disabled={
                                    pagination.page === pagination.totalPages
                                }
                                className={cn(
                                    'inline-flex items-center justify-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/50 hover:text-primary',
                                    pagination.page === pagination.totalPages &&
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

import { getTime } from '@web-tech/ui/lib/time'
import { MainContent } from '~/shared/ui/main-content'
import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import type { SearchData } from '~/lib/get-search-data'
import {
    applyDocsIndexControls,
    filterDocsIndexControls,
    resolveDocsIndexControls,
    type DocsIndexControls,
} from '~/widgets/docs-index/model/docs-index-controls'
import {
    ALL_DOCS_PAGE_SIZE,
    getPaginationRange,
} from '~/widgets/docs-index/model/docs-index-pagination'
import { getDocsIndexSectionSummary } from '~/widgets/docs-index/model/docs-index-summary'
import { DocsIndexCard } from './docs-index-card'
import { DocsIndexControlsBar } from './docs-index-controls-bar'
import { DocsIndexEmptyState } from './docs-index-empty-state'
import { DocsSearchPanel } from './docs-search-panel'
import { DocsIndexPagination } from './docs-index-pagination'
import { DocsIndexSections } from './docs-index-sections'
import { DocsIndexStats } from './docs-index-stats'
import { getMotionOrderStyle } from './docs-index-motion'

type DocsIndexProps = {
    docs: SearchData[]
    recommendations: readonly string[]
    currentPage?: number
    controls?: DocsIndexControls
    keyword?: string
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
            <MainContent className="docs-shell motion-layout px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
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
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                                    {t('search.matchingEyebrow')}
                                </p>
                                <h2 className="mt-2 break-keep text-2xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]">
                                    {t('search.matchingTitle')}
                                </h2>
                            </div>
                            <Link
                                href="/docs"
                                data-touch-target="docs-index"
                                className="ds-focus-ring inline-flex min-h-11 items-center rounded-full px-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
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
            </MainContent>
        )
    }

    return (
        <MainContent className="docs-shell motion-layout px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="space-y-7">
                <DocsSearchPanel
                    eyebrow={t('index.eyebrow')}
                    title={t('index.title')}
                    description={t('index.description')}
                    placeholder={t('index.placeholder')}
                    submitLabel={t('index.submit')}
                    recommendations={recommendations}
                />

                <DocsIndexStats
                    totalDocs={visibleDocs.length}
                    sectionCount={sectionSummary.length}
                    latestUpdated={latestUpdated}
                />

                <DocsIndexControlsBar
                    controls={resolvedControls}
                    resultCount={visibleDocs.length}
                />

                <DocsIndexSections sectionSummary={sectionSummary} />

                <section className="space-y-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                                {t('allDocuments.eyebrow')}
                            </p>
                            <h2 className="mt-2 break-keep text-2xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]">
                                {t('allDocuments.title')}
                            </h2>
                            <p className="mt-2 break-keep text-sm text-on-surface-variant [overflow-wrap:anywhere]">
                                {t('allDocuments.pageSummary', {
                                    start: pagination.rangeStart,
                                    end: pagination.rangeEnd,
                                    total: visibleDocs.length,
                                })}
                            </p>
                        </div>
                        <Link
                            href="/feed"
                            data-touch-target="docs-index"
                            className="ds-focus-ring inline-flex min-h-11 items-center rounded-full px-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
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
                    <DocsIndexPagination
                        pagination={pagination}
                        controls={resolvedControls}
                    />
                </section>
            </div>
        </MainContent>
    )
}

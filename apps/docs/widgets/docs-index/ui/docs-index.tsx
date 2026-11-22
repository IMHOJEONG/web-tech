import { MainContent } from '~/shared/ui/main-content'
import { getTranslations } from 'next-intl/server'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import type { SearchData } from '~/lib/get-search-data'
import {
    applyDocsIndexControls,
    filterDocsIndexControls,
    resolveDocsIndexControls,
    type DocsIndexControls,
} from '../model/docs-index-controls'
import {
    ALL_DOCS_PAGE_SIZE,
    getPaginationRange,
} from '../model/docs-index-pagination'
import { DocsIndexCard } from './docs-index-card'
import { DocsIndexControlsBar } from './docs-index-controls-bar'
import { DocsIndexActiveFilters } from './docs-index-active-filters'
import { DocsIndexEmptyState } from './docs-index-empty-state'
import { DocsSearchPanel } from './docs-search-panel'
import { DocsIndexPagination } from './docs-index-pagination'
import { getMotionOrderStyle } from './docs-index-motion'
import { DocsIndexDiscovery } from './docs-index-discovery'
import {
    journalPageLayout,
    journalListLayout,
} from '~/shared/ui/journal-layout'

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
    const resolved = controls ?? resolveDocsIndexControls({})
    const activeControls = keyword
        ? { ...resolved, sort: 'latest' as const }
        : resolved
    const visibleDocs = keyword
        ? filterDocsIndexControls(docs, activeControls)
        : applyDocsIndexControls(docs, activeControls)
    const pagination = getPaginationRange({
        currentPage,
        pageSize: ALL_DOCS_PAGE_SIZE,
        totalCount: visibleDocs.length,
    })
    const resultDocs = keyword
        ? visibleDocs
        : visibleDocs.slice(
              pagination.startIndex,
              pagination.startIndex + pagination.pageSize
          )

    return (
        <MainContent className={`${journalPageLayout} motion-layout`}>
            <div className="space-y-5">
                <DocsSearchPanel
                    keyword={keyword}
                    eyebrow={t(keyword ? 'search.eyebrow' : 'index.eyebrow')}
                    title={
                        keyword
                            ? t('search.title', {
                                  keyword: formatSearchKeyword(keyword),
                              })
                            : t('index.title')
                    }
                    placeholder={t(
                        keyword ? 'search.placeholder' : 'index.placeholder'
                    )}
                    submitLabel={t(keyword ? 'search.submit' : 'index.submit')}
                />
                <DocsIndexControlsBar
                    controls={activeControls}
                    keyword={keyword}
                    resultCount={visibleDocs.length}
                    showSort={!keyword}
                />
                <DocsIndexActiveFilters
                    controls={activeControls}
                    keyword={keyword}
                />
                <section
                    aria-labelledby="docs-index-results-title"
                    data-testid="docs-index-results"
                    className="space-y-4"
                >
                    <div className="min-w-0">
                        <h2
                            id="docs-index-results-title"
                            className="break-keep text-xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]"
                        >
                            {t(
                                keyword
                                    ? 'search.matchingTitle'
                                    : 'allDocuments.title'
                            )}
                        </h2>
                        {!keyword && (
                            <p className="mt-2 text-sm text-on-surface-variant">
                                {t('allDocuments.pageSummary', {
                                    start: pagination.rangeStart,
                                    end: pagination.rangeEnd,
                                    total: visibleDocs.length,
                                })}
                            </p>
                        )}
                    </div>
                    {visibleDocs.length === 0 ? (
                        <DocsIndexEmptyState
                            controls={activeControls}
                            keyword={keyword}
                        />
                    ) : (
                        <div className={`${journalListLayout} motion-layout`}>
                            {resultDocs.map((doc, index) => (
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
                    {!keyword && (
                        <DocsIndexPagination
                            pagination={pagination}
                            controls={activeControls}
                        />
                    )}
                </section>
                <DocsIndexDiscovery
                    docs={docs}
                    controls={activeControls}
                    keyword={keyword}
                    recommendations={recommendations}
                />
            </div>
        </MainContent>
    )
}

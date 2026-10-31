import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import type { DocsIndexControls } from '../model/docs-index-controls'
import { DocsSearchPanel } from './docs-search-panel'
import { DocsIndexActiveFilters } from './docs-index-active-filters'
import { DocsIndexControlsBar } from './docs-index-controls-bar'
import {
    journalPageLayout,
    journalListLayout,
} from '~/shared/ui/journal-layout'

export async function DocsIndexPending({
    keyword,
    controls,
}: {
    keyword?: string
    controls: DocsIndexControls
}) {
    const t = await getTranslations('docsIndex')
    const activeControls = keyword
        ? { ...controls, sort: 'latest' as const }
        : controls
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending="docs"
            className={journalPageLayout}
        >
            <PendingStatus />
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
                    showSort={!keyword}
                />
                <DocsIndexActiveFilters
                    controls={activeControls}
                    keyword={keyword}
                />
                <section
                    className="space-y-4"
                    data-skeleton-anchor="docs-results"
                >
                    <div>
                        <h2 className="break-keep text-xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]">
                            {t(
                                keyword
                                    ? 'search.matchingTitle'
                                    : 'allDocuments.title'
                            )}
                        </h2>
                        {!keyword && (
                            <SkeletonBlock className="mt-2 h-5 w-28" />
                        )}
                    </div>
                    <div
                        aria-hidden="true"
                        className={`${journalListLayout} motion-safe:animate-pulse`}
                    >
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="py-6">
                                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <SkeletonBlock className="h-4 w-36" />
                                        <SkeletonBlock className="h-12 w-4/5 md:h-7" />
                                        <div className="space-y-2">
                                            <SkeletonBlock className="h-4 w-full" />
                                            <SkeletonBlock className="h-4 w-4/5" />
                                        </div>
                                        <SkeletonBlock className="h-7 w-3/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </MainContent>
    )
}

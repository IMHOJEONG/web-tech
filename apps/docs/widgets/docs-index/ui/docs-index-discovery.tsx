import { ChevronDown } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getTime } from '@web-tech/ui/lib/time'
import type { SearchData } from '~/lib/get-search-data'
import { Link } from '~/shared/i18n/navigation'
import type { DocsIndexControls } from '../model/docs-index-controls'
import {
    getDocsIndexLatestUpdate,
    getDocsIndexSectionSummary,
} from '../model/docs-index-summary'
import { ContentCollectionNavigation } from './content-collection-navigation'
import { ContentTagFilters } from './content-tag-filters'
import { DocsIndexSections } from './docs-index-sections'
import { DocsIndexStats } from './docs-index-stats'
import { DocsSearchRecommendations } from './docs-search-recommendations'

type Props = {
    docs: SearchData[]
    controls: DocsIndexControls
    keyword?: string
    recommendations: readonly string[]
}

export async function DocsIndexDiscovery({
    docs,
    controls,
    keyword,
    recommendations,
}: Props) {
    const t = await getTranslations('docsIndex')
    const sections = getDocsIndexSectionSummary(docs)
    const latest = getDocsIndexLatestUpdate(docs)

    return (
        <aside
            aria-label={t('discovery.more')}
            data-testid="docs-index-secondary"
            className="min-w-0 border-t border-border pt-5"
        >
            <details
                open={Boolean(controls.tag || controls.collection)}
                data-testid="docs-index-discovery"
                className="group/discovery min-w-0 rounded-xl border border-border bg-surface-container-lowest px-4 py-3"
            >
                <summary
                    data-touch-target="docs-index"
                    className="ds-focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md [&::-webkit-details-marker]:hidden"
                >
                    <span className="min-w-0">
                        <span className="block font-display text-sm font-semibold text-on-surface">
                            {t('discovery.more')}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-on-surface-variant">
                            {t('discovery.description')}
                        </span>
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className="size-4 shrink-0 text-outline transition-transform duration-200 group-open/discovery:rotate-180 motion-reduce:transition-none motion-reduce:duration-0"
                    />
                </summary>
                <div className="min-w-0 space-y-5 border-t border-border pt-4 mt-3">
                    {!keyword && (
                        <>
                            <DocsIndexStats
                                sectionCount={sections.length}
                                latestUpdated={latest ? getTime(latest) : null}
                            />
                            <DocsIndexSections sectionSummary={sections} />
                        </>
                    )}
                    <ContentTagFilters
                        docs={docs}
                        controls={controls}
                        keyword={keyword}
                    />
                    <ContentCollectionNavigation
                        docs={docs}
                        controls={controls}
                        keyword={keyword}
                    />
                    <DocsSearchRecommendations terms={recommendations} />
                    <Link
                        href={keyword ? '/docs' : '/feed'}
                        data-touch-target="docs-index"
                        className="ds-focus-ring inline-flex min-h-11 items-center rounded-md text-sm text-on-surface-variant hover:text-primary"
                    >
                        {t(
                            keyword
                                ? 'search.backToDocs'
                                : 'allDocuments.toFeed'
                        )}
                    </Link>
                </div>
            </details>
        </aside>
    )
}

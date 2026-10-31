import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import {
    DOCS_INDEX_SECTION_FILTERS,
    DOCS_INDEX_SORT_OPTIONS,
    getDocsIndexHref,
    type DocsIndexControls,
} from '~/widgets/docs-index/model/docs-index-controls'
import { DocsIndexControlPill } from './docs-index-control-pill'

type DocsIndexControlsBarProps = {
    controls: DocsIndexControls
    keyword?: string
    resultCount?: number
    showSort?: boolean
}

export function DocsIndexControlsBar({
    controls,
    keyword,
    resultCount,
    showSort = true,
}: DocsIndexControlsBarProps) {
    const t = useTranslations('docsIndex')

    return (
        <details
            data-testid="docs-index-filters"
            className="group motion-layout max-w-full border-b border-border pb-3"
        >
            <summary className="ds-focus-ring flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-2 rounded-md [&::-webkit-details-marker]:hidden">
                <span className="break-keep text-sm font-semibold text-on-surface [overflow-wrap:anywhere]">
                    {t('filters.title', { count: resultCount ?? '…' })}
                </span>
                <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                    {t(showSort ? 'filters.toggle' : 'filters.toggleSearch')}
                    <ChevronDown
                        aria-hidden="true"
                        className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                </span>
            </summary>

            <div className="mt-3 grid min-w-0 gap-3 border-t border-border pt-3">
                <div className="flex min-w-0 flex-wrap gap-2 pb-1">
                    {DOCS_INDEX_SECTION_FILTERS.map((filter) => (
                        <DocsIndexControlPill
                            key={filter.value}
                            active={controls.section === filter.value}
                            href={getDocsIndexHref({
                                controls,
                                keyword,
                                overrides: { section: filter.value },
                            })}
                        >
                            {t(`filters.sections.${filter.messageKey}`)}
                        </DocsIndexControlPill>
                    ))}
                </div>

                {showSort && (
                    <div className="flex min-w-0 flex-wrap gap-2">
                        {DOCS_INDEX_SORT_OPTIONS.map((sort) => (
                            <DocsIndexControlPill
                                key={sort}
                                active={controls.sort === sort}
                                href={getDocsIndexHref({
                                    controls,
                                    keyword,
                                    overrides: { sort },
                                })}
                            >
                                {t(`filters.sorts.${sort}`)}
                            </DocsIndexControlPill>
                        ))}
                    </div>
                )}
            </div>
        </details>
    )
}

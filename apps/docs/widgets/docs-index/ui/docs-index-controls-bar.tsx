import { getTranslations } from 'next-intl/server'
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
    resultCount: number
    showSort?: boolean
}

export async function DocsIndexControlsBar({
    controls,
    keyword,
    resultCount,
    showSort = true,
}: DocsIndexControlsBarProps) {
    const t = await getTranslations('docsIndex')

    return (
        <section className="motion-layout max-w-full rounded-2xl border border-border bg-surface-container-lowest p-4">
            <div className="motion-layout flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                        {t('filters.eyebrow')}
                    </p>
                    <h2 className="mt-1 break-keep text-lg font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]">
                        {t('filters.title', { count: resultCount })}
                    </h2>
                </div>

                <div className="grid min-w-0 gap-3 lg:min-w-[38rem]">
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
            </div>
        </section>
    )
}

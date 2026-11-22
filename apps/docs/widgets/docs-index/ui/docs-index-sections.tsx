import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import {
    getDocsIndexSectionMessageKey,
    type getDocsIndexSectionSummary,
} from '../model/docs-index-summary'

export async function DocsIndexSections({
    sectionSummary,
}: {
    sectionSummary: ReturnType<typeof getDocsIndexSectionSummary>
}) {
    const t = await getTranslations('docsIndex')
    return (
        <section className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="break-keep text-sm font-semibold text-on-surface [overflow-wrap:anywhere]">
                        {t('sections.title')}
                    </h2>
                </div>
                <Link
                    href="/category"
                    data-touch-target="docs-index"
                    className="ds-focus-ring inline-flex min-h-11 items-center rounded-full px-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
                >
                    {t('sections.toCategory')}
                </Link>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
                {sectionSummary.map((section) => {
                    const sectionKey = getDocsIndexSectionMessageKey(
                        section.key
                    )

                    return (
                        <Link
                            key={section.key}
                            href={section.href}
                            data-touch-target="docs-index"
                            className="ds-focus-ring inline-flex min-h-11 min-w-0 max-w-full flex-wrap items-center gap-x-2 rounded-lg border border-border px-3 py-2 text-sm text-on-surface transition-colors hover:border-primary/40 hover:text-primary motion-reduce:transition-none"
                        >
                            <span className="font-medium [overflow-wrap:anywhere]">
                                {t(`sectionLabels.${sectionKey}`)}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                                {t('sections.documentCount', {
                                    count: section.count,
                                })}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </section>
    )
}

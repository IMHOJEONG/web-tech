import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import { getTime } from '@web-tech/ui/lib/time'
import {
    getDocsIndexSectionMessageKey,
    type getDocsIndexSectionSummary,
} from '../model/docs-index-summary'
import { getMotionOrderStyle } from './docs-index-motion'

export async function DocsIndexSections({
    sectionSummary,
}: {
    sectionSummary: ReturnType<typeof getDocsIndexSectionSummary>
}) {
    const t = await getTranslations('docsIndex')
    return (
        <section className="space-y-4">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                        {t('sections.eyebrow')}
                    </p>
                    <h2 className="mt-2 break-keep text-2xl font-bold tracking-tight text-on-surface [overflow-wrap:anywhere]">
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
            <div className="motion-layout grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                {sectionSummary.map((section, index) => {
                    const sectionKey = getDocsIndexSectionMessageKey(
                        section.key
                    )

                    return (
                        <Link
                            key={section.key}
                            href={section.href}
                            data-touch-target="docs-index"
                            className="ds-focus-ring motion-layout motion-reveal group rounded-2xl border border-border bg-surface-container-lowest p-4 hover:-translate-y-0.5 hover:border-primary/40"
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
    )
}

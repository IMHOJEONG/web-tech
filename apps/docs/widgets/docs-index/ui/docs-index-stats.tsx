import { getTranslations } from 'next-intl/server'
import { getMotionOrderStyle } from './docs-index-motion'

export async function DocsIndexStats({
    totalDocs,
    sectionCount,
    latestUpdated,
}: {
    totalDocs: number
    sectionCount: number
    latestUpdated: string | null
}) {
    const t = await getTranslations('docsIndex')
    return (
        <section className="motion-layout grid gap-3 md:grid-cols-3">
            <div
                className="motion-layout motion-reveal rounded-2xl border border-border bg-surface-container-lowest p-4"
                style={getMotionOrderStyle(0)}
            >
                <p className="text-xs font-semibold tracking-[0.16em] text-outline uppercase">
                    {t('stats.totalDocs')}
                </p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                    {totalDocs}
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
                    {sectionCount}
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
    )
}

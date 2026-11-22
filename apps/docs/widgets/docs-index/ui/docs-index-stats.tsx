import { getTranslations } from 'next-intl/server'

export async function DocsIndexStats({
    sectionCount,
    latestUpdated,
}: {
    sectionCount: number
    latestUpdated: string | null
}) {
    const t = await getTranslations('docsIndex')
    return (
        <dl
            data-testid="docs-index-stats"
            className="flex min-w-0 flex-wrap gap-x-6 gap-y-2 text-xs leading-5"
        >
            <div className="flex min-w-0 flex-wrap gap-x-2">
                <dt className="text-on-surface-variant">
                    {t('stats.sections')}
                </dt>
                <dd className="font-mono font-semibold tabular-nums text-on-surface">
                    {sectionCount}
                </dd>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-2">
                <dt className="text-on-surface-variant">
                    {t('stats.latestUpdate')}
                </dt>
                <dd className="font-mono text-on-surface">
                    {latestUpdated ?? t('stats.pending')}
                </dd>
            </div>
        </dl>
    )
}

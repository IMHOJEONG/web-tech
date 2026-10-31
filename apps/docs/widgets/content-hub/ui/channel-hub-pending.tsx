import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import { HubHeader } from './hub-header'
import {
    journalPageLayout,
    journalListLayout,
} from '~/shared/ui/journal-layout'

export async function ChannelHubPending({
    channel,
}: {
    channel: 'web' | 'mobile'
}) {
    const t = await getTranslations('channelHub')
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending={channel}
            className={journalPageLayout}
        >
            <PendingStatus />
            <div className="min-w-0 space-y-6">
                <HubHeader
                    eyebrow={t(`${channel}.hero.eyebrow`)}
                    title={t(`${channel}.hero.title`)}
                    description={t(`${channel}.hero.description`)}
                    stats={[
                        {
                            label: t('stats.totalDocs'),
                            value: (
                                <span
                                    aria-hidden="true"
                                    className="inline-block h-4 w-4 rounded bg-surface-container-low align-middle"
                                />
                            ),
                        },
                        {
                            label: t('stats.latestUpdate'),
                            value: (
                                <span
                                    aria-hidden="true"
                                    className="inline-block h-4 w-20 rounded bg-surface-container-low align-middle"
                                />
                            ),
                        },
                    ]}
                />
                <div
                    aria-hidden="true"
                    className="flex min-h-11 gap-2 motion-safe:animate-pulse"
                >
                    <SkeletonBlock className="h-11 w-20 rounded-full" />
                    <SkeletonBlock className="h-11 w-24 rounded-full" />
                </div>
                <section
                    className="min-w-0 space-y-4"
                    data-skeleton-anchor="hub-results"
                >
                    <SkeletonBlock className="h-6 w-40" />
                    <div
                        aria-hidden="true"
                        className={`${journalListLayout} motion-safe:animate-pulse`}
                    >
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="min-w-0 py-6">
                                <div className="flex flex-col gap-3">
                                    <div className="space-y-2">
                                        <SkeletonBlock className="h-10 w-full" />
                                        <SkeletonBlock className="h-10 w-4/5" />
                                        <SkeletonBlock className="h-4 w-20" />
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

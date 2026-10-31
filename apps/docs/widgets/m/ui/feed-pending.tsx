import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { DocumentPreviewSkeleton } from '~/entities/document/ui/document-preview-skeleton'
import { FeedFilters } from './feed-filters'
import { FeedContentLayout } from './feed-content-layout'
import {
    journalPageLayout,
    journalEyebrow,
    journalListLayout,
} from '~/shared/ui/journal-layout'

export async function FeedPending() {
    const lead = await getTranslations('feedLeadStory')
    const recent = await getTranslations('feedRecent')
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending="feed"
            className={`${journalPageLayout} text-on-surface`}
        >
            <PendingStatus />
            <FeedContentLayout>
                <section className="border-b border-border">
                    <div className="mx-auto max-w-page space-y-3">
                        <p className={journalEyebrow}>{lead('label')}</p>
                        <div className="motion-safe:animate-pulse">
                            <DocumentPreviewSkeleton />
                        </div>
                    </div>
                </section>
                <section className="py-8">
                    <div className="mx-auto max-w-page space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-2">
                                <h2 className="font-display text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
                                    {recent('title')}
                                </h2>
                                <p className="text-sm text-on-surface-variant">
                                    {recent('description')}
                                </p>
                            </div>
                            <div inert aria-hidden="true">
                                <FeedFilters activeFilter="all" />
                            </div>
                        </div>
                        <div
                            className={`${journalListLayout} motion-safe:animate-pulse`}
                        >
                            <DocumentPreviewSkeleton />
                            <DocumentPreviewSkeleton />
                        </div>
                    </div>
                </section>
            </FeedContentLayout>
        </MainContent>
    )
}

import { useTranslations } from 'next-intl'
import { MainContent } from '~/shared/ui/main-content'
import type { Metadata } from '~/lib/get-document'
import { getFeedArticles, type FeedFilter } from '../model/feed-document'
import { FeedLeadStory } from './feed-lead-story'
import { FeedRecentArticles } from './feed-recent-articles'
import { FeedContentLayout } from './feed-content-layout'
import { journalPageLayout } from '~/shared/ui/journal-layout'

export { normalizeFeedFilter, type FeedFilter } from '../model/feed-document'

export function MainFeed({
    docs,
    activeFilter = 'all',
}: {
    docs: Partial<Metadata>[]
    activeFilter?: FeedFilter
}) {
    const t = useTranslations('feedRecent')
    const [lead, ...remaining] = getFeedArticles(docs, activeFilter)

    return (
        <MainContent
            className={`${journalPageLayout} motion-layout text-on-surface`}
        >
            <FeedContentLayout>
                {lead ? (
                    <FeedLeadStory {...lead} />
                ) : (
                    <section className="border-b border-border py-6">
                        <div className="mx-auto max-w-page space-y-3">
                            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                                {t('emptyTitle')}
                            </h1>
                            <p className="text-sm text-on-surface-variant">
                                {t('emptyDescription')}
                            </p>
                        </div>
                    </section>
                )}
                <FeedRecentArticles
                    articles={remaining.slice(0, 4)}
                    activeFilter={activeFilter}
                />
            </FeedContentLayout>
        </MainContent>
    )
}

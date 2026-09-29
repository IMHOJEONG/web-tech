import { useTranslations } from 'next-intl'
import { MainContent } from '~/shared/ui/main-content'
import type { Metadata } from '~/lib/get-document'
import { getFeedArticles, type FeedFilter } from '../model/feed-document'
import { FeedLeadStory } from './feed-lead-story'
import { FeedRecentArticles } from './feed-recent-articles'

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
        <MainContent className="motion-layout w-full bg-[linear-gradient(180deg,var(--background)_0%,var(--surface-container-lowest)_100%)] text-on-surface">
            {lead ? (
                <FeedLeadStory {...lead} />
            ) : (
                <section className="border-b border-outline-variant px-4 py-8 sm:px-6 md:px-8">
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
        </MainContent>
    )
}

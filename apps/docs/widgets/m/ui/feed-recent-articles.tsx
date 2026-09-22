import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'
import { DocumentPreviewCard } from '~/entities/document/ui/document-preview-card'
import { Link } from '~/shared/i18n/navigation'
import type { FeedArticle, FeedFilter } from '../model/feed-document'
import { FeedFilters } from './feed-filters'

type FeedRecentArticlesProps = {
    articles: FeedArticle[]
    activeFilter: FeedFilter
}

export function FeedRecentArticles({
    articles,
    activeFilter,
}: FeedRecentArticlesProps) {
    const t = useTranslations('feedRecent')
    const reading = useTranslations('feedLeadStory')
    return (
        <section
            data-testid="feed-recent-articles"
            aria-labelledby="feed-recent-title"
            className="motion-layout px-4 py-8 sm:px-6 md:px-8 lg:py-10"
        >
            <div className="mx-auto max-w-page space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <h2
                            id="feed-recent-title"
                            className="font-display text-xl font-semibold tracking-tight text-on-surface sm:text-2xl"
                        >
                            {t('title')}
                        </h2>
                        <p className="text-sm text-on-surface-variant">
                            {t('description')}
                        </p>
                    </div>
                    <FeedFilters activeFilter={activeFilter} />
                </div>
                {articles.length > 0 ? (
                    <ul className="grid gap-4">
                        {articles.map(({ readMinutes, ...article }, index) => (
                            <li
                                key={article.href}
                                className="motion-reveal min-w-0"
                                style={
                                    { '--motion-order': index } as CSSProperties
                                }
                            >
                                <DocumentPreviewCard
                                    {...article}
                                    headingLevel="h3"
                                    readingTime={reading('readingTime', {
                                        count: readMinutes,
                                    })}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="rounded-xl border border-outline-variant bg-surface-container-low p-6 text-sm text-on-surface-variant">
                        {t('empty')}
                    </p>
                )}
                <div className="flex justify-center pt-2">
                    <Link
                        href={activeFilter === 'all' ? '/docs' : '/feed'}
                        className="ds-outline-button ds-focus-ring min-h-11 gap-3 px-5 py-2 text-sm"
                    >
                        {t(activeFilter === 'all' ? 'browse' : 'reset')}
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                </div>
            </div>
        </section>
    )
}

import { useTranslations } from 'next-intl'
import { DocumentPreviewCard } from '~/entities/document/ui/document-preview-card'
import type { FeedArticle } from '../model/feed-document'

export function FeedLeadStory({ readMinutes, ...article }: FeedArticle) {
    const t = useTranslations('feedLeadStory')

    return (
        <section
            data-testid="feed-lead-story"
            className="motion-layout border-b border-outline-variant bg-surface-container-lowest px-4 py-6 sm:px-6 md:px-8 lg:py-8"
        >
            <div className="mx-auto max-w-page space-y-3">
                <p className="text-xs font-semibold tracking-wide text-on-surface-variant">
                    {t('label')}
                </p>
                <DocumentPreviewCard
                    {...article}
                    headingLevel="h1"
                    unoptimized
                    readingTime={t('readingTime', { count: readMinutes })}
                />
            </div>
        </section>
    )
}

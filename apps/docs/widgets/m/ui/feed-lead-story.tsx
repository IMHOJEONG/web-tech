import { useTranslations } from 'next-intl'
import { DocumentPreviewCard } from '~/entities/document/ui/document-preview-card'
import type { FeedArticle } from '../model/feed-document'
import { journalEyebrow } from '~/shared/ui/journal-layout'

export function FeedLeadStory({ readMinutes, ...article }: FeedArticle) {
    const t = useTranslations('feedLeadStory')

    return (
        <section
            data-testid="feed-lead-story"
            className="motion-layout border-b border-border"
        >
            <div className="mx-auto max-w-page space-y-3">
                <p className={journalEyebrow}>{t('label')}</p>
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

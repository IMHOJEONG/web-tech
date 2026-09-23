import { useTranslations } from 'next-intl'
import { DocumentPreviewCard } from '~/entities/document/ui/document-preview-card'
import type { UiUxDoc } from '../model/uiux-hub-docs'

export function UiUxArticleCard({
    doc,
    fallbackImage,
}: {
    doc: UiUxDoc
    fallbackImage: string
}) {
    const t = useTranslations('uiuxHub')
    const readingTime =
        typeof doc.readMinutes === 'number' && doc.readMinutes > 0
            ? t('readingTime', { count: doc.readMinutes })
            : undefined

    return (
        <DocumentPreviewCard
            href={doc.href}
            title={doc.title}
            summary={doc.summary}
            topic={doc.topicLabel?.trim() || 'UI/UX'}
            thumbnail={doc.thumbnail ?? fallbackImage}
            readingTime={readingTime}
        />
    )
}

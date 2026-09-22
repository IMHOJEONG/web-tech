import { useTranslations } from 'next-intl'
import { DocumentPreviewCard } from '~/entities/document/ui/document-preview-card'
import type { UiUxDoc } from './uiux-hub.types'

export function UiUxArticleCard({
    doc,
    label,
    fallbackImage,
}: {
    doc: UiUxDoc
    label: string
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
            topic={label}
            thumbnail={doc.thumbnail ?? fallbackImage}
            readingTime={readingTime}
        />
    )
}

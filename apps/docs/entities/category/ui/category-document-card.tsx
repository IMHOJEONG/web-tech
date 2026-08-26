import Link from 'next/link'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'

interface CategoryDocumentCardItem {
    slug?: string
    summary?: string
    thumbnail?: string | null
    title?: string
    date?: string
    fileName?: string
}

export const CategoryDocumentCard = ({
    data,
}: {
    data: CategoryDocumentCardItem
}) => {
    const { summary, thumbnail, title, date, fileName } = data

    return (
        <Link
            href={`/${fileName}`}
            className="ds-card flex size-full flex-col gap-3 bg-surface-container-lowest p-4 hover:-translate-y-1"
        >
            <DocumentThumbnail
                thumbnail={thumbnail}
                alt={title}
                fallback="local"
                className="aspect-square w-full rounded-2xl"
            />
            <div className="text-lg font-semibold text-on-surface">{title}</div>
            <div className="min-h-12 break-keep text-sm leading-6 text-on-surface-variant line-clamp-2">
                {summary}
            </div>
            <DocumentDateText date={date} className="text-xs text-outline" />
        </Link>
    )
}

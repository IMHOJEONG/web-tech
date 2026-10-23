import { Link } from '~/shared/i18n/navigation'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'
import { DocumentCardMeta } from './document-card-meta'
import {
    documentPreviewLayout,
    documentPreviewThumbnailLayout,
} from './document-preview-layout'

type DocumentPreviewCardProps = {
    href: string
    title: string
    summary: string
    topic: string
    thumbnail?: string | null
    authorName?: string
    readingTime?: string
    headingLevel?: 'h1' | 'h2' | 'h3'
    unoptimized?: boolean
}

export function DocumentPreviewCard({
    href,
    title,
    summary,
    topic,
    thumbnail,
    authorName,
    readingTime,
    headingLevel: Heading = 'h2',
    unoptimized = false,
}: DocumentPreviewCardProps) {
    return (
        <Link
            href={href}
            aria-label={title}
            className={`group ds-card ds-focus-ring motion-interactive-card ${documentPreviewLayout} hover:border-primary/40`}
        >
            <div className="min-w-0 space-y-4">
                <div className="space-y-2">
                    <p className="break-words text-xs font-semibold tracking-wide text-primary">
                        {topic}
                    </p>
                    <Heading className="font-display break-words text-2xl font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary group-focus-visible:text-primary motion-reduce:transition-none sm:text-3xl">
                        {title}
                    </Heading>
                </div>
                <p className="line-clamp-3 break-words text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
                    {summary}
                </p>
                <DocumentCardMeta
                    authorName={authorName}
                    readingTime={readingTime}
                />
            </div>
            <DocumentThumbnail
                thumbnail={thumbnail}
                alt=""
                className={documentPreviewThumbnailLayout}
                imageClassName="object-contain p-3"
                sizes="(min-width: 1024px) 288px, (min-width: 768px) 224px, (min-width: 640px) calc(100vw - 96px), calc(100vw - 72px)"
                unoptimized={unoptimized}
            />
        </Link>
    )
}

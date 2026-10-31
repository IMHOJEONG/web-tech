import { Link } from '~/shared/i18n/navigation'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'
import { DocumentCardMeta } from './document-card-meta'
import { cn } from '@web-tech/ui/lib/utils'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { hasDocumentThumbnail } from '~/shared/assets/default-thumbnails'
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
    date?: string
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
    date,
    headingLevel: Heading = 'h2',
    unoptimized = false,
}: DocumentPreviewCardProps) {
    const showThumbnail = hasDocumentThumbnail(thumbnail)

    return (
        <Link
            href={href}
            aria-label={title}
            data-document-preview
            className={cn(
                'group ds-focus-ring rounded-sm transition-colors motion-reduce:transition-none',
                documentPreviewLayout,
                showThumbnail && 'md:grid-cols-[minmax(0,1fr)_10rem]'
            )}
        >
            <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
                    <p className="break-words font-medium tracking-wide text-[var(--docs-interactive-text)]">
                        {topic}
                    </p>
                    {date && (
                        <DocumentDateText
                            date={date}
                            className="text-on-surface-variant"
                        />
                    )}
                </div>
                <Heading
                    className={cn(
                        'font-display break-keep font-semibold leading-snug tracking-tight text-on-surface transition-colors [overflow-wrap:anywhere] group-hover:text-[var(--docs-interactive-text)] group-focus-visible:text-[var(--docs-interactive-text)] motion-reduce:transition-none',
                        Heading === 'h1'
                            ? 'text-2xl sm:text-4xl'
                            : 'text-lg sm:text-xl'
                    )}
                >
                    {title}
                </Heading>
                <p className="line-clamp-3 break-words text-sm leading-7 text-on-surface-variant sm:text-base">
                    {summary}
                </p>
                <DocumentCardMeta
                    authorName={authorName}
                    readingTime={readingTime}
                />
            </div>
            {showThumbnail && (
                <DocumentThumbnail
                    thumbnail={thumbnail}
                    alt=""
                    className={documentPreviewThumbnailLayout}
                    imageClassName="object-contain p-3"
                    sizes="(min-width: 768px) 160px, (min-width: 640px) calc(100vw - 96px), calc(100vw - 32px)"
                    unoptimized={unoptimized}
                />
            )}
        </Link>
    )
}

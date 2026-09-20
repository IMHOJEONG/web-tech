import { ArrowUpRight } from 'lucide-react'
import { Link } from '~/shared/i18n/navigation'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'
import { DocumentCardMeta } from './document-card-meta'

type DocumentPreviewCardProps = {
    href: string
    title: string
    summary: string
    topic: string
    thumbnail?: string | null
    authorName?: string
    readingTime: string
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
            className="group ds-card ds-focus-ring grid min-w-0 gap-5 bg-surface-container-lowest p-5 transition-colors hover:border-primary/40 motion-reduce:transition-none sm:p-6 md:grid-cols-[minmax(0,1fr)_14rem] md:items-center md:gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
            <div className="min-w-0 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words text-xs font-semibold tracking-wide text-primary">
                        {topic}
                    </span>
                    <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-on-surface-variant transition-colors group-hover:text-primary group-focus-visible:text-primary"
                    />
                </div>
                <Heading className="font-display break-words text-2xl font-bold leading-snug tracking-tight text-on-surface sm:text-3xl">
                    {title}
                </Heading>
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
                className="h-36 w-full rounded-lg sm:h-40 md:h-48"
                imageClassName="object-contain p-3"
                sizes="(min-width: 1024px) 288px, (min-width: 768px) 224px, (min-width: 640px) calc(100vw - 96px), calc(100vw - 72px)"
                unoptimized={unoptimized}
            />
        </Link>
    )
}

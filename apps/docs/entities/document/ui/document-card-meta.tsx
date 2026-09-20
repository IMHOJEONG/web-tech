type DocumentCardMetaProps = {
    authorName?: string
    readingTime: string
}

export function DocumentCardMeta({
    authorName,
    readingTime,
}: DocumentCardMetaProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
            {authorName && <span>{authorName}</span>}
            {authorName && <span aria-hidden="true">/</span>}
            <span>{readingTime}</span>
        </div>
    )
}

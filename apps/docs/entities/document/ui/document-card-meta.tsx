type DocumentCardMetaProps = {
    authorName?: string
    readingTime?: string
}

export function DocumentCardMeta({
    authorName,
    readingTime,
}: DocumentCardMetaProps) {
    if (!authorName && !readingTime) return null

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
            {authorName && <span>{authorName}</span>}
            {authorName && readingTime && <span aria-hidden="true">/</span>}
            {readingTime && <span>{readingTime}</span>}
        </div>
    )
}

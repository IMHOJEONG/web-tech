import { Metadata } from '~/lib/get-document'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'
import { hasDocumentThumbnail } from '~/shared/assets/default-thumbnails'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, thumbnail } = doc
    return (
        <div className="flex min-w-0 flex-col-reverse gap-4 md:flex-row-reverse md:items-center md:gap-6">
            {hasDocumentThumbnail(thumbnail) && (
                <DocumentThumbnail
                    thumbnail={thumbnail}
                    alt=""
                    className="h-28 w-full shrink-0 rounded-md md:w-40"
                    imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(min-width: 768px) 160px, calc(100vw - 32px)"
                />
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-3 text-wrap">
                <h3 className="break-keep text-lg font-semibold leading-snug tracking-tight text-on-surface [overflow-wrap:anywhere] group-hover:text-[var(--docs-interactive-text)] group-focus-visible:text-[var(--docs-interactive-text)] sm:text-xl">
                    {title}
                </h3>

                {summary && (
                    <div className="line-clamp-2 text-sm leading-7 text-on-surface-variant">
                        {summary}
                    </div>
                )}

                <DocumentDateText
                    date={date}
                    className="font-mono text-xs text-on-surface-variant"
                />
            </div>
        </div>
    )
}

export default MainCard

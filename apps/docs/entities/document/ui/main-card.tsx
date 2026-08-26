import { Metadata } from '~/lib/get-document'
import { DocumentDateText } from '~/shared/ui/document-date-text'
import { DocumentThumbnail } from '~/shared/ui/document-thumbnail'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, thumbnail } = doc
    return (
        <div className="flex size-full flex-col gap-3 rounded-lg">
            <DocumentThumbnail
                thumbnail={thumbnail}
                alt={title}
                className="aspect-video w-full rounded-xl"
                imageClassName="transition-transform duration-300 group-hover:scale-[1.03]"
            />

            <div className="flex flex-1 flex-col gap-2 text-wrap">
                <div className="line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                    {title}
                </div>

                {summary && (
                    <div className="line-clamp-2 text-[0.8125rem] font-normal leading-5 text-on-surface-variant">
                        {summary}
                    </div>
                )}

                <DocumentDateText
                    date={date}
                    className="mt-auto pt-1 text-[0.6875rem] tracking-wider text-outline uppercase"
                />
            </div>
        </div>
    )
}

export default MainCard

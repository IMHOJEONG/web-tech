import { getTime } from '@web-tech/ui/lib/time'
import Image from 'next/image'
import { Metadata } from '~/lib/get-document'
import { DEFAULT_DOCUMENT_THUMBNAIL } from '~/shared/assets/default-thumbnails'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, thumbnail } = doc
    return (
        <div className="flex size-full flex-col gap-3 rounded-lg">
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-surface-container-high">
                <Image
                    src={thumbnail ?? DEFAULT_DOCUMENT_THUMBNAIL}
                    alt={title ?? ''}
                    width={1920}
                    height={1080}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>

            <div className="flex flex-1 flex-col gap-2 text-wrap">
                <div className="line-clamp-2 text-[0.95rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                    {title}
                </div>

                {summary && (
                    <div className="line-clamp-2 text-[0.8125rem] font-normal leading-5 text-on-surface-variant">
                        {summary}
                    </div>
                )}

                <div className="mt-auto pt-1 text-[0.6875rem] tracking-wider text-outline uppercase">
                    {getTime(date ?? '')}
                </div>
            </div>
        </div>
    )
}

export default MainCard

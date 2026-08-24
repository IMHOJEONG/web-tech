import { getTime } from '@web-tech/ui/lib/time'
import Image from 'next/image'
import { Metadata } from '~/lib/get-document'
import { DEFAULT_DOCUMENT_THUMBNAIL } from '~/shared/assets/default-thumbnails'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, thumbnail } = doc
    return (
        <div className="grid size-full grid-cols-1 justify-between gap-3 rounded-lg md:grid-cols-[0.36fr_0.64fr]">
            <div className="aspect-video w-full overflow-hidden rounded-lg md:aspect-4/3">
                <Image
                    src={thumbnail ?? DEFAULT_DOCUMENT_THUMBNAIL}
                    alt={title ?? ''}
                    width={1920}
                    height={1080}
                    className="h-full w-full rounded-lg object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>

            <div className="flex flex-col justify-between gap-1.5 text-wrap">
                <div className="line-clamp-2 text-base font-semibold leading-snug tracking-[-0.01em] text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                    {title}
                </div>

                {summary && (
                    <div className="line-clamp-2 text-sm font-normal leading-6 text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                        {summary}
                    </div>
                )}

                <div className="mt-0.5 text-[0.6875rem] tracking-wider text-[var(--hf-text-primary)] uppercase dark:text-[var(--hf-text-primary)]">
                    {getTime(date ?? '')}
                </div>
            </div>
        </div>
    )
}

export default MainCard

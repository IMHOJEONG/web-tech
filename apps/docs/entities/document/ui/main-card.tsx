import { getTime } from '@web-tech/ui/lib/time'
import Image from 'next/image'
import { Metadata } from '~/lib/get-document'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, thumbnail } = doc
    return (
        <div className="grid size-full grid-cols-1 justify-between gap-3 rounded-lg md:grid-cols-[0.4fr_0.6fr]">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
                <Image
                    src={thumbnail ?? '/default/no-image.webp'}
                    alt={title ?? ''}
                    width={1920}
                    height={1080}
                    className="h-full w-full rounded-lg object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>

            <div className="flex flex-col justify-between gap-2 text-wrap">
                <div className="line-clamp-2 text-[1.05rem] font-semibold leading-snug tracking-[-0.01em] text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                    {title}
                </div>

                {summary && (
                    <div className="line-clamp-3 text-[0.90rem] font-normal leading-relaxed text-[var(--hf-text-primary)] dark:text-[var(--hf-text-primary)]">
                        {summary}
                    </div>
                )}

                <div className="mt-1 text-xs tracking-wider text-[var(--hf-text-primary)] uppercase dark:text-[var(--hf-text-primary)]">
                    {getTime(date ?? '')}
                </div>
            </div>
        </div>
    )
}

export default MainCard

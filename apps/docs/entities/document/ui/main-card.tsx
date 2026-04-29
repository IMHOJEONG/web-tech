import { getTime } from '@web-tech/ui/lib/time'
import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import { Metadata } from '~/lib/get-document'

const MainCard = ({ doc }: { doc: Partial<Metadata> }) => {
    const { title, date, summary, slug, content, thumbnail } = doc
    return (
        <div
            className={cn(
                'size-full',
                'grid grid-cols-1 md:grid-cols-[0.4fr_0.6fr]',
                'gap-3 rounded-lg',
                'justify-between'
            )}
        >
            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
                <Image
                    src={thumbnail ?? '/default/no-image.webp'}
                    alt={title ?? ''}
                    width={1920}
                    height={1080}
                    className="rounded-lg w-full h-full object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>

            <div className="flex flex-col justify-between gap-2 text-wrap">
                <div
                    className={cn(
                        'text-[1.05rem] font-semibol',
                        'dark:text-[var(--hf-text-primary)]',
                        'text-[var(--hf-text-primary)]',
                        'tracking-[-0.01em] leading-snug line-clamp-2'
                    )}
                >
                    {title}
                </div>

                {summary && (
                    <div
                        className={cn(
                            'text-[0.90rem] font-normal',
                            'dark:text-[var(--hf-text-primary)]',
                            'text-[var(--hf-text-primary)]',
                            'leading-relaxed line-clamp-3'
                        )}
                    >
                        {summary}
                    </div>
                )}

                <div
                    className={cn(
                        'text-[0.75rem]',
                        'dark:text-[var(--hf-text-primary)]',
                        'text-[var(--hf-text-primary)]',
                        'uppercase tracking-wider mt-1'
                    )}
                >
                    {getTime(date ?? '')}
                </div>
            </div>
        </div>
    )
}

export default MainCard

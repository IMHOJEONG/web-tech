import { cn } from '@web-tech/ui/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface CategoryDocumentCardItem {
    slug?: string
    summary?: string
    thumbnail?: string | null
    title?: string
    date?: string
    fileName?: string
}

export const CategoryDocumentCard = ({
    data,
}: {
    data: CategoryDocumentCardItem
}) => {
    const { summary, thumbnail, title, date, fileName } = data

    return (
        <Link
            className={cn(
                'size-full',
                'p-2 flex flex-col gap-2',
                'items-center justify-center',
                'dark:hover:bg-gray-500',
                'hover:bg-slate-300',
                'rounded rounded-lg'
            )}
            href={`/${fileName}`}
        >
            <div className="relative w-full max-w-[200px] min-w-[200px] aspect-square">
                <Image
                    src={thumbnail ?? ''}
                    alt="category-image"
                    fill
                    sizes="(max-width: 768px) 100vw, 200px"
                    className="object-cover"
                    quality={90}
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>
            <div className="text-lg">{title}</div>
            <div
                className={cn(
                    'text-sm leading-6 line-clamp-2 min-h-[3rem]',
                    'break-keep'
                )}
            >
                {summary}
            </div>
            <div className="text-xs">{date}</div>
        </Link>
    )
}

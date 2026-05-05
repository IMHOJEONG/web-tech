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
            href={`/${fileName}`}
            className="flex size-full flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:border-zinc-700"
        >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                <Image
                    src={thumbnail ?? ''}
                    alt="category-image"
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                    quality={90}
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
            </div>
            <div className="min-h-[3rem] break-keep text-sm leading-6 text-zinc-500 line-clamp-2 dark:text-zinc-400">
                {summary}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {date}
            </div>
        </Link>
    )
}

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
            className="ds-card flex size-full flex-col gap-3 bg-surface-container-lowest p-4 hover:-translate-y-1"
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
            <div className="text-lg font-semibold text-on-surface">{title}</div>
            <div className="min-h-[3rem] break-keep text-sm leading-6 text-on-surface-variant line-clamp-2">
                {summary}
            </div>
            <div className="text-xs text-outline">{date}</div>
        </Link>
    )
}

import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface CategoryBoxItem {
    slug?: string
    summary?: string
    thumbnail?: string | null
    title?: string
    date?: string
    fileName?: string
}

export const CategoryBox = ({ data }: { data: CategoryBoxItem }) => {
    const { summary, thumbnail, title, date, slug, fileName } = data

    console.log(slug)

    return (
        <Link
            className={cn(
                'p-2 flex flex-col gap-2',

                'items-center justify-center'
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
                />
            </div>
            <div className="text-lg">{title}</div>
            <div className="text-sm leading-6 line-clamp-2 min-h-[3rem]">
                {summary}
            </div>
            <div className="text-xs">{date}</div>
        </Link>
    )
}

import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { mainCategories } from '~/feature/category/category-item'

// category 소개 페이지 만들면 될 듯
export default function Page() {
    const mainCategory = mainCategories

    return (
        <div className={cn('flex flex-col gap-3')}>
            {mainCategory.map(({ title, url }) => (
                <Link key={url} href={url}>
                    {title}
                </Link>
            ))}
        </div>
    )
}

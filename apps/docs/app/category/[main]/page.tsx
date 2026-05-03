import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { getSubCategories } from '~/entities/category/model/category'
import { SubCategoryCard } from '~/entities/category/ui/sub-category-card'

export default async function Page({
    params,
}: {
    params: Promise<{ main: string }>
}) {
    const { main: mainCategory } = await params
    const subCategories = await getSubCategories(mainCategory)
    console.log(mainCategory, subCategories)

    return (
        <div className={cn('w-full', 'grid grid-cols-3 gap-3', 'p-3')}>
            {subCategories?.map(({ title, url }) => (
                <Link
                    key={url}
                    href={url}
                    className={cn(
                        'flex flex-col',
                        'items-center justify-center',
                        'cursor-pointer',
                        'dark:hover:bg-gray-500',
                        'hover:bg-slate-300',
                        'rounded rounded-lg'
                    )}
                >
                    <SubCategoryCard id={title} />
                </Link>
            ))}
        </div>
    )
}

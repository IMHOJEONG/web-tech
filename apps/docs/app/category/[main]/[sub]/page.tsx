import { cn } from '@/lib/utils'
import { TocItem } from 'remark-flexible-toc'
import { CategoryBox } from '~/feature/category/category-box'
import { getSubCategoryData } from '~/lib/get-category'

type Scope = {
    readingTime: string
    toc?: TocItem[]
}

type Frontmatter = {
    title: string
    author: string
}

export default async function Page({
    params,
}: {
    params: Promise<{ main: string; sub: string }>
}) {
    const { main, sub } = await params
    const data = await getSubCategoryData(main, sub)
    console.log(data)

    return (
        <div className={cn('w-full', 'grid grid-cols-3 gap-3', 'p-3')}>
            <div className="flex-1">
                {data.map((item) => {
                    return <CategoryBox key={item.title} data={item} />
                })}
            </div>
        </div>
    )
}

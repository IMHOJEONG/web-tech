import { cn } from '@/lib/utils'
import Link from 'next/link'
import { getSubCategories } from '~/feature/category/category-item'

export default async function Page({
    params,
}: {
    params: Promise<{ main: string }>
}) {
    const { main: mainCategory } = await params
    const subCategories = await getSubCategories(mainCategory)
    console.log(mainCategory, subCategories)

    return (
        <div className={cn('flex flex-col gap-3')}>
            {subCategories?.map(({ title, url }) => (
                <Link key={url} href={url}>
                    {title}
                </Link>
            ))}
        </div>
    )
}

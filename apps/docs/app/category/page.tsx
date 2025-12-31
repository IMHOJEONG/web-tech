import { Badge } from '@web-tech/ui/components/badge'
import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import { mainCategories } from '~/feature/category/category-item'
import { MainBox } from '~/feature/category/main-box'
// category 소개 페이지 만들면 될 듯
export default function Page() {
    const mainCategory = mainCategories

    return (
        <div className={cn('w-full', 'flex flex-col', 'gap-3', 'p-3')}>
            <div className={cn('w-full', 'flex gap-2', 'px-2 py-2')}>
                {mainCategory.map(({ title, url }) => {
                    return (
                        <Badge
                            className={cn(
                                'text-lg',
                                'bg-gray-100',
                                'text-black',
                                'cursor-pointer'
                            )}
                            key={title}
                        >
                            {title}
                        </Badge>
                    )
                })}
            </div>
            <div className={cn('w-full', 'grid grid-cols-3 gap-5')}>
                {mainCategory.map(({ title, url }) => (
                    <Link
                        key={url}
                        href={url}
                        className={cn(
                            'cursor-pointer',
                            'dark:hover:bg-gray-500',
                            'hover:bg-slate-300',
                            'rounded rounded-lg'
                        )}
                    >
                        <MainBox id={title} />
                    </Link>
                ))}
            </div>
        </div>
    )
}

import { cn } from '@/lib/utils'
import Image from 'next/image'

interface SubCategoryBoxItem {
    id: string
}

const subCategory = [
    {
        title: 'React',
        id: 'react',
        icon: '/category/sub/react.png',
        description: 'react 기술 소개',
    },
    {
        title: 'svelte',
        id: 'svelte',
        icon: '/category/sub/svelte.png',
        description: 'svelte 기술 소개',
    },
    {
        title: 'React Router v7',
        id: 'react-router',
        icon: '/category/sub/react-router.png',
        description: 'react-router 기술 소개',
    },
    {
        title: 'Astro',
        id: 'astro',
        icon: '/category/sub/astro.png',
        description: 'astro 기술 소개',
    },
]

export const SubCategoryBox = ({ id }: SubCategoryBoxItem) => {
    const item = subCategory.find(
        (sub) => sub.id === id.toLowerCase().split(' ').join('-')
    )
    return (
        <div className={cn('w-full flex flex-col gap-2', 'p-3')}>
            <div className="relative w-full aspect-square max-w-[200px] ">
                <Image
                    src={item?.icon ?? '/test.png'}
                    width={0}
                    height={0}
                    fill
                    alt="sub-category"
                    sizes="100vw"
                    className="rounded rounded-lg"
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>
            <div>{item?.title}</div>
            <div>{item?.description}</div>
        </div>
    )
}

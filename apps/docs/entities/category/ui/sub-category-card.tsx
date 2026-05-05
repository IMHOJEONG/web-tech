import Image from 'next/image'

interface SubCategoryCardProps {
    id: string
}

const subCategoryCards = [
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

export const SubCategoryCard = ({ id }: SubCategoryCardProps) => {
    const item = subCategoryCards.find(
        (sub) => sub.id === id.toLowerCase().split(' ').join('-')
    )

    return (
        <div className="flex size-full flex-col items-center justify-center gap-2 p-3">
            <div className="relative aspect-square w-full">
                <Image
                    src={item?.icon ?? '/test.png'}
                    alt="sub-category"
                    fill
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="rounded-lg"
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

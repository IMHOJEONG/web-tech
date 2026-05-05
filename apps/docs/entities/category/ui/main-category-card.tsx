import Image from 'next/image'

interface MainCategoryCardProps {
    id: string
}

const mainCategoryCards = [
    {
        title: 'Frontend',
        key: 'fe',
        image: '/category/main/fe_info.png',
        summary: '화면을 그리는 기술을 의미',
    },
    {
        title: 'Backend',
        key: 'be',
        image: '/category/main/be_info.png',
        summary: 'API, 서버 등 기능 중심의 개발을 의미 ',
    },
    {
        title: 'Computer science',
        key: 'computer-science',
        image: '/category/main/cs_info.png',
        summary: '컴퓨터 과학을 전반적으로 다루는 카테고리',
    },
]

export const MainCategoryCard = ({ id }: MainCategoryCardProps) => {
    const data = mainCategoryCards.find(
        (item) => item.key === id.toLowerCase().split(' ').join('-')
    )

    return (
        <div className="flex size-full flex-col gap-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-zinc-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_42%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(241,245,249,0.9))] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.9))]">
                <Image
                    fill
                    src={data?.image ?? '/test.png'}
                    alt="category Images"
                    width={0}
                    height={0}
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-contain p-5"
                    priority
                    placeholder="blur"
                    blurDataURL="/image/blur-image.webp"
                />
            </div>
            <div className="space-y-2">
                <div className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {data?.title}
                </div>
                <div className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    {data?.summary}
                </div>
            </div>
        </div>
    )
}

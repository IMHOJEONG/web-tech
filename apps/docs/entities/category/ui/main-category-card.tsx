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
            <div className="ds-panel-muted relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_10%,transparent),transparent_42%),linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,white_4%),color-mix(in_srgb,var(--surface-container-low)_94%,transparent))]">
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
                <div className="text-xl font-semibold tracking-tight text-on-surface">
                    {data?.title}
                </div>
                <div className="text-sm leading-6 text-on-surface-variant">
                    {data?.summary}
                </div>
            </div>
        </div>
    )
}

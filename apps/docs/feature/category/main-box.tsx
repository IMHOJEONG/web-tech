import { cn } from '@/lib/utils'
import Image from 'next/image'

interface MainBoxProps {
    id: string
}

const mainData = [
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

export const MainBox = ({ id }: MainBoxProps) => {
    const data = mainData.find(
        (item) => item.key === id.toLowerCase().split(' ').join('-')
    )
    // const { title, summary } = data
    return (
        <div className={cn('flex flex-col gap-2', 'p-2')}>
            <div className={cn('relative w-full aspect-square max-w-[200px]')}>
                <Image
                    fill
                    src={data?.image ?? '/test.png'}
                    alt="category Images"
                    width={0}
                    height={0}
                    quality={90}
                    sizes="(max-width: 768px) 200vw, 200px"
                    className="rounded rounded-lg"
                    priority
                />
            </div>
            <div className="text-xl">{data?.title}</div>
            <div>{data?.summary}</div>
        </div>
    )
}

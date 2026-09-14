import { Box, Cpu, Globe2, Network, ServerCog } from 'lucide-react'
import { FaReact, FaRegWindowRestore } from 'react-icons/fa'
import { SiNodedotjs } from 'react-icons/si'

export const makeCategoryUrl = (segments: string[]) => {
    return ['/category', ...segments].join('/')
}

export const categoryTree = [
    {
        title: 'FE',
        url: 'fe',
        icon: FaRegWindowRestore,
        summary: '브라우저와 프론트엔드 애플리케이션의 실행 구조를 다룹니다.',
        sub: [
            {
                title: 'React',
                url: 'react',
                icon: FaReact,
                summary: '컴포넌트 경계, 렌더링, 상태 설계 원칙을 정리합니다.',
            },
            {
                title: 'Browser',
                url: 'browser',
                icon: Globe2,
                summary:
                    '렌더링 경로와 성능 문제를 브라우저 내부 흐름으로 해석합니다.',
            },
        ],
    },
    {
        title: 'BE',
        url: 'be',
        icon: ServerCog,
        summary: 'API와 서버 런타임의 신뢰성 경계를 다룹니다.',
        sub: [
            {
                title: 'Node.js',
                url: 'node-js',
                icon: SiNodedotjs,
                summary: 'Node.js 서버의 요청 처리와 운영 기준을 정리합니다.',
            },
        ],
    },
    {
        title: 'Computer Science',
        url: 'computer-science',
        icon: Cpu,
        summary: '운영체제와 네트워크의 핵심 원리를 실무 문제와 연결합니다.',
        sub: [
            {
                title: 'OS',
                url: 'os',
                icon: Cpu,
                summary: '프로세스, 스레드, 메모리와 스케줄링을 다룹니다.',
            },
            {
                title: 'Network',
                url: 'network',
                icon: Network,
                summary: 'DNS부터 HTTP 응답까지 요청 경로를 단계별로 다룹니다.',
            },
        ],
    },
    {
        title: 'Infrastructure',
        url: 'infra',
        icon: ServerCog,
        summary:
            '컨테이너, 배포, 관측성을 운영 가능한 시스템 관점에서 다룹니다.',
        sub: [
            {
                title: 'Containers',
                url: 'containers',
                icon: Box,
                summary:
                    '컨테이너 상태 확인과 안전한 트래픽 연결 기준을 정리합니다.',
            },
        ],
    },
] as const

export const categoryMainLinks = categoryTree.map((item) => {
    const { title, url } = item

    return {
        title,
        url: makeCategoryUrl([url]),
    }
})

export const getSubCategories = (category: string) => {
    const mainItem = categoryTree.find(
        (item) =>
            item.title.toLowerCase() === category.toLowerCase() ||
            item.url.toLowerCase() === category.toLowerCase()
    )

    return mainItem?.sub.map((value) => {
        return {
            ...value,
            url: makeCategoryUrl([mainItem.url, value.url]),
        }
    })
}

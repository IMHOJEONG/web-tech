import { Box, Cpu, Globe2, Network, ServerCog } from 'lucide-react'
import { FaReact, FaRegWindowRestore } from 'react-icons/fa'
import { SiNodedotjs } from 'react-icons/si'
import type { CategoryGroupConfig } from './category.types'

export const makeCategoryUrl = (segments: string[]) => {
    return ['/category', ...segments].join('/')
}

export const categoryTree = [
    {
        title: 'FE',
        url: 'fe',
        icon: FaRegWindowRestore,
        summaryKey: 'groups.fe',
        sub: [
            {
                title: 'React',
                url: 'react',
                icon: FaReact,
                summaryKey: 'topics.react',
            },
            {
                title: 'Browser',
                url: 'browser',
                icon: Globe2,
                summaryKey: 'topics.browser',
            },
        ],
    },
    {
        title: 'BE',
        url: 'be',
        icon: ServerCog,
        summaryKey: 'groups.be',
        sub: [
            {
                title: 'Node.js',
                url: 'node-js',
                icon: SiNodedotjs,
                summaryKey: 'topics.node-js',
            },
        ],
    },
    {
        title: 'Computer Science',
        url: 'computer-science',
        icon: Cpu,
        summaryKey: 'groups.computer-science',
        sub: [
            {
                title: 'OS',
                url: 'os',
                icon: Cpu,
                summaryKey: 'topics.os',
            },
            {
                title: 'Network',
                url: 'network',
                icon: Network,
                summaryKey: 'topics.network',
            },
        ],
    },
    {
        title: 'Infrastructure',
        url: 'infra',
        icon: ServerCog,
        summaryKey: 'groups.infra',
        sub: [
            {
                title: 'Containers',
                url: 'containers',
                icon: Box,
                summaryKey: 'topics.containers',
            },
        ],
    },
] as const satisfies readonly CategoryGroupConfig[]

export function getCategoryTopic(main: string, sub: string) {
    const category = categoryTree.find((item) => item.url === main)
    const topic = category?.sub.find((item) => item.url === sub)

    return category && topic ? { category, topic } : null
}

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

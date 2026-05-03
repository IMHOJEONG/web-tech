import { Search, Settings } from 'lucide-react'
import { FaReact, FaRegWindowRestore } from 'react-icons/fa'
import { SiAstro, SiReactrouter, SiSvelte } from 'react-icons/si'

export const makeCategoryUrl = (segments: string[]) => {
    return ['/category', ...segments].join('/')
}

export const categoryTree = [
    {
        title: 'FE',
        url: 'fe',
        icon: FaRegWindowRestore,
        sub: [
            {
                title: 'React',
                url: 'react',
                icon: FaReact,
            },
            {
                title: 'React Router',
                url: 'react-router',
                icon: SiReactrouter,
            },
            {
                title: 'Svelte',
                url: 'svelte',
                icon: SiSvelte,
            },
            {
                title: 'Astro',
                url: 'astro',
                icon: SiAstro,
            },
        ],
    },
    {
        title: 'BE',
        url: 'be',
        icon: Search,
        sub: [
            {
                title: 'Node.js',
                url: 'node-js',
                icon: SiAstro,
            },
            {
                title: 'Rust',
                url: 'rust',
                icon: SiAstro,
            },
        ],
    },
    {
        title: 'Computer Science',
        url: 'computer-science',
        icon: Settings,
        sub: [
            {
                title: 'OS',
                url: 'os',
                icon: SiAstro,
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
        (item) => item.title.toLowerCase() === category.toLowerCase()
    )

    return mainItem?.sub.map((value) => {
        const { title, url } = value

        return {
            title,
            url: makeCategoryUrl([mainItem.url, url]),
        }
    })
}

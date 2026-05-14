import type { SearchData } from '~/lib/get-search-data'

export type UiUxDoc = SearchData & {
    title: string
    href: string
    summary: string
}

export const UIUX_FALLBACK_IMAGES = {
    featured: '/figma/article-detail/hero-abstract-technology.png',
    first: '/figma/article-detail/design-detail-1.png',
    second: '/figma/article-detail/design-detail-2.png',
    tutorial: '/figma/article-detail/mobile-interface-mockup.png',
} as const

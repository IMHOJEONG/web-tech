import type { SearchData } from '~/lib/get-search-data'

export type UiUxDoc = SearchData & {
    title: string
    summary: string
}

export function selectUiUxHubDocs(docs: readonly SearchData[]) {
    const seen = new Set<string>()
    const articles: UiUxDoc[] = []

    for (const doc of docs) {
        const title = doc.title?.trim()
        const href = doc.href.trim()
        if (!title || !href || seen.has(href)) continue
        seen.add(href)
        articles.push({
            ...doc,
            title,
            href,
            summary: doc.summary?.trim() ?? '',
        })
    }

    return {
        featured: articles.slice(0, 3),
        spotlight: articles[3] ?? null,
        more: articles.slice(4, 7),
        isEmpty: articles.length === 0,
    }
}

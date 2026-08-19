import type { SearchData } from './get-search-data'
import { buildSearchPreview } from './search-preview.ts'

export type SearchResultItem = SearchData & {
    preview: {
        titleHtml: string
        excerptHtml: string
    }
}

export function buildSearchResultItem(
    doc: SearchData,
    keyword?: string
): SearchResultItem {
    return {
        ...doc,
        preview: buildSearchPreview(doc, keyword),
    }
}

export function buildSearchResultItems(
    docs: SearchData[],
    keyword?: string
): SearchResultItem[] {
    return docs.map((doc) => buildSearchResultItem(doc, keyword))
}

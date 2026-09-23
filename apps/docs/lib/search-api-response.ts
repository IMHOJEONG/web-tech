import type { SearchData } from './get-search-data'
import { normalizeSearchQuery } from '../shared/lib/search-query.ts'
import {
    buildSearchResultItems,
    type SearchResultItem,
} from './search-result-contract.ts'

export type SearchApiResponse = {
    query: string
    count: number
    results: SearchResultItem[]
}

export function buildSearchApiResponse(
    docs: SearchData[],
    query?: string | null
): SearchApiResponse {
    const normalizedQuery = normalizeSearchQuery(query)

    return {
        query: normalizedQuery,
        count: docs.length,
        results: buildSearchResultItems(docs, normalizedQuery),
    }
}

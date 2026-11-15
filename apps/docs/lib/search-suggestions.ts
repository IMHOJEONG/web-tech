import type { SearchData } from './get-search-data'
import { RECOMMENDED_SEARCH_TERMS } from './docs-search-page-state.ts'
import { normalizeSearchQuery } from '../shared/lib/search-query.ts'

export const SEARCH_SUGGESTION_LIMIT = 8
export type SearchSuggestion = Pick<
    SearchData,
    'id' | 'href' | 'section' | 'readMinutes'
> & { title: string; summary: string }
export type SearchSuggestionsResponse = {
    query: string
    count: number
    results: SearchSuggestion[]
    suggestions: string[]
}

export function isSearchSuggestionsResponse(
    value: unknown
): value is SearchSuggestionsResponse {
    if (!value || typeof value !== 'object') return false
    const data = value as SearchSuggestionsResponse
    return (
        typeof data.query === 'string' &&
        Number.isSafeInteger(data.count) &&
        data.count >= 0 &&
        Array.isArray(data.suggestions) &&
        data.suggestions.length <= 5 &&
        data.suggestions.every((term) => typeof term === 'string') &&
        Array.isArray(data.results) &&
        data.results.length <= SEARCH_SUGGESTION_LIMIT &&
        data.count >= data.results.length &&
        data.results.every(
            (doc) =>
                doc &&
                typeof doc.id === 'string' &&
                typeof doc.title === 'string' &&
                typeof doc.summary === 'string' &&
                typeof doc.section === 'string' &&
                typeof doc.href === 'string' &&
                /^\/(?!\/)/.test(doc.href) &&
                !Array.from(doc.href).some(
                    (character) =>
                        character === '\\' || character.charCodeAt(0) <= 32
                ) &&
                (doc.readMinutes === undefined ||
                    (Number.isFinite(doc.readMinutes) && doc.readMinutes > 0))
        )
    )
}

export function buildSearchSuggestions(
    docs: SearchData[],
    query?: string | readonly string[] | null
): SearchSuggestionsResponse {
    const normalized = normalizeSearchQuery(query)
    const comparison = normalized.toLowerCase()
    const terms = [
        ...RECOMMENDED_SEARCH_TERMS,
        ...docs
            .slice(0, SEARCH_SUGGESTION_LIMIT)
            .flatMap((doc) => doc.tags ?? []),
    ]
    const seen = new Set<string>()
    return {
        query: normalized,
        count: docs.length,
        results: docs.slice(0, SEARCH_SUGGESTION_LIMIT).map((doc) => ({
            id: doc.id,
            href: doc.href.replaceAll(' ', '%20'),
            title: Array.from(doc.title || doc.slug)
                .slice(0, 160)
                .join(''),
            summary: Array.from(doc.summary ?? '')
                .slice(0, 180)
                .join(''),
            section: doc.section,
            readMinutes: doc.readMinutes,
        })),
        suggestions: terms
            .map((term) => normalizeSearchQuery(term))
            .filter((term) => {
                const key = term.toLowerCase()
                if (
                    !key ||
                    seen.has(key) ||
                    (comparison && !key.includes(comparison))
                )
                    return false
                seen.add(key)
                return key !== comparison
            })
            .slice(0, 5),
    }
}

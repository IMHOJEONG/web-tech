export const SEARCH_QUERY_MAX_LENGTH = 40

export function firstSearchParam(value?: string | readonly string[] | null) {
    return typeof value === 'string' ? value : (value?.[0] ?? '')
}

// Count code points, not UTF-16 units, so truncation never splits a surrogate pair.
export function limitSearchInput(value: string) {
    return Array.from(value.normalize('NFC'))
        .slice(0, SEARCH_QUERY_MAX_LENGTH)
        .join('')
}

export function normalizeSearchQuery(
    value?: string | readonly string[] | null
) {
    return limitSearchInput(
        firstSearchParam(value).trim().replace(/\s+/gu, ' ')
    ).trim()
}

export function getSearchHref(value: string) {
    const query = normalizeSearchQuery(value)
    return query ? `/docs?${new URLSearchParams({ q: query })}` : '/docs'
}

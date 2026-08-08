import type { SearchData } from './get-search-data'

const SEARCH_PREVIEW_FALLBACK_LIMIT = 180
const SEARCH_PREVIEW_CONTEXT_LIMIT = 180

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function normalizeKeyword(keyword: string) {
    return keyword.trim().toLowerCase()
}

function tokenizeKeyword(keyword: string) {
    return normalizeKeyword(keyword)
        .split(/[\s/_-]+/)
        .map((token) => token.trim())
        .filter(Boolean)
}

function buildHighlightRegex(tokens: string[]) {
    const escapedTokens = tokens
        .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .sort((a, b) => b.length - a.length)

    return escapedTokens.length > 0
        ? new RegExp(`(${escapedTokens.join('|')})`, 'gi')
        : null
}

function findFirstMatchIndex(value: string, tokens: string[]) {
    const lowerValue = value.toLowerCase()
    let firstMatch = -1

    for (const token of tokens) {
        const index = lowerValue.indexOf(token)

        if (index === -1) {
            continue
        }

        if (firstMatch === -1 || index < firstMatch) {
            firstMatch = index
        }
    }

    return firstMatch
}

function trimExcerpt(value: string, startIndex: number, maxLength: number) {
    if (value.length <= maxLength) {
        return value
    }

    const safeStart = Math.max(0, startIndex)
    const centeredStart = Math.max(
        0,
        Math.min(
            safeStart - Math.floor(maxLength / 3),
            value.length - maxLength
        )
    )
    const excerpt = value.slice(centeredStart, centeredStart + maxLength).trim()
    const prefix = centeredStart > 0 ? '... ' : ''
    const suffix = centeredStart + maxLength < value.length ? ' ...' : ''

    return `${prefix}${excerpt}${suffix}`
}

export function highlightSearchText(value: string, keyword?: string) {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
        return ''
    }

    const tokens = tokenizeKeyword(keyword ?? '')
    const regex = buildHighlightRegex(tokens)

    if (!regex) {
        return escapeHtml(trimmedValue)
    }

    return escapeHtml(trimmedValue).replace(
        regex,
        '<mark class="search-highlight">$1</mark>'
    )
}

export function buildSearchPreview(doc: SearchData, keyword?: string) {
    const tokens = tokenizeKeyword(keyword ?? '')

    if (!tokens.length) {
        return {
            titleHtml: escapeHtml(doc.title ?? doc.slug),
            excerptHtml: escapeHtml(
                (doc.summary ?? doc.content)
                    .trim()
                    .slice(0, SEARCH_PREVIEW_FALLBACK_LIMIT)
            ),
        }
    }

    const title = doc.title ?? doc.slug
    const summary = doc.summary?.trim() ?? ''
    const content = doc.content.trim()

    const summaryMatchIndex = summary
        ? findFirstMatchIndex(summary, tokens)
        : -1
    const contentMatchIndex = content
        ? findFirstMatchIndex(content, tokens)
        : -1

    const excerptSource =
        summaryMatchIndex !== -1
            ? trimExcerpt(
                  summary,
                  summaryMatchIndex,
                  SEARCH_PREVIEW_CONTEXT_LIMIT
              )
            : contentMatchIndex !== -1
              ? trimExcerpt(
                    content,
                    contentMatchIndex,
                    SEARCH_PREVIEW_CONTEXT_LIMIT
                )
              : trimExcerpt(
                    summary || content,
                    0,
                    SEARCH_PREVIEW_FALLBACK_LIMIT
                )

    return {
        titleHtml: highlightSearchText(title, keyword),
        excerptHtml: highlightSearchText(excerptSource, keyword),
    }
}

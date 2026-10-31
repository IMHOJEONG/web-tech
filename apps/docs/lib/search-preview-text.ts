import sanitizeHtml from 'sanitize-html'
import { decodeHTML } from 'entities'

export const SEARCH_PREVIEW_INPUT_LIMIT = 32_768

function previewWindow(value: string, tokens: readonly string[]) {
    if (value.length <= SEARCH_PREVIEW_INPUT_LIMIT) return value
    let offset = 0
    const overlap = Math.min(
        SEARCH_PREVIEW_INPUT_LIMIT,
        Math.max(0, ...tokens.map((token) => token.length))
    )
    for (
        let start = 0;
        tokens.length && start < value.length;
        start += SEARCH_PREVIEW_INPUT_LIMIT
    ) {
        const chunk = value
            .slice(start, start + SEARCH_PREVIEW_INPUT_LIMIT + overlap)
            .toLowerCase()
        const matches = tokens
            .map((token) => chunk.indexOf(token))
            .filter((index) => index >= 0)
        if (matches.length) {
            offset = Math.max(0, start + Math.min(...matches) - 512)
            break
        }
    }
    return value.slice(offset, offset + SEARCH_PREVIEW_INPUT_LIMIT)
}

function escapeCode(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

// Preview text only: never render Markdown or execute MDX in a result list.
export function getSearchPreviewText(
    value: string,
    tokens: readonly string[] = []
) {
    const input = previewWindow(value, tokens)
        .replace(
            /(^|\n) {0,3}(`{3,}|~{3,})[^\n]*\n([\s\S]*?)(?:\n {0,3}\2[\t ]*(?=\n|$)|$)/g,
            (_match, boundary: string, _fence: string, body: string) =>
                boundary + escapeCode(body)
        )
        .replace(/(`+)([\s\S]*?)\1/g, (_match, _ticks: string, body: string) =>
            escapeCode(body)
        )
    const text = decodeHTML(
        sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    )

    return text
        .replace(/^ {0,3}(?:`{3,}|~{3,})[^\n]*$/gm, '')
        .replace(
            /^ {0,3}(?:#{1,6}[\t ]+|>[\t ]?|(?:[-+*]|\d{1,9}[.)])[\t ]+)/gm,
            ''
        )
        .replace(/!?\[([^\]\n]{0,300})\]\([^\n)]{0,2048}\)/g, '$1')
        .replace(/`+/g, '')
        .replace(/\*{1,3}|~~/g, '')
        .replace(/(^|\s)_([^_\n]{1,512})_(?=\W|$)/g, '$1$2')
        .replace(/\s+/g, ' ')
        .trim()
}

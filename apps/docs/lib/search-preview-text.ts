import sanitizeHtml from 'sanitize-html'
import { decodeHTML } from 'entities'

export const SEARCH_PREVIEW_INPUT_LIMIT = 32_768

function escapeCode(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

function normalizePreviewWindow(value: string) {
    const input = value
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

// Normalize bounded windows before matching: attributes are not visible text.
// Carry fence state forward so windows cut inside code still escape JSX.
export function getSearchPreviewText(
    value: string,
    tokens: readonly string[] = []
) {
    const fences = value.matchAll(/^ {0,3}(`{3,}|~{3,})/gm)
    const closingSuffix = /[\t ]*(?:\r?\n|$)/y
    let nextFence = fences.next()
    let openFence = ''
    let fallback = ''
    const step = SEARCH_PREVIEW_INPUT_LIMIT - 1024

    for (let start = 0; start < value.length; start += step) {
        while (!nextFence.done && nextFence.value.index < start) {
            const marker = nextFence.value[1]!
            closingSuffix.lastIndex =
                nextFence.value.index + nextFence.value[0].length
            if (!openFence) openFence = marker
            else if (
                marker[0] === openFence[0] &&
                marker.length >= openFence.length &&
                closingSuffix.test(value)
            ) {
                openFence = ''
            }
            nextFence = fences.next()
        }
        const window = value.slice(start, start + SEARCH_PREVIEW_INPUT_LIMIT)
        const text = normalizePreviewWindow(
            openFence ? `${openFence}\n${window}` : window
        )
        if (start === 0) fallback = text
        if (!tokens.length) return text
        const lowerText = text.toLowerCase()
        if (tokens.some((token) => lowerText.includes(token))) return text
    }
    return fallback
}

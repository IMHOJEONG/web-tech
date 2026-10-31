import sanitizeHtml from 'sanitize-html'
import { decodeHTML } from 'entities'

// Preview text only: never render Markdown or execute MDX in a result list.
export function getSearchPreviewText(value: string) {
    const text = decodeHTML(
        sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
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

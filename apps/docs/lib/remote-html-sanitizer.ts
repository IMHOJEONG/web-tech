import sanitizeHtml from 'sanitize-html'

const ALLOWED_REMOTE_HTML_TAGS = [
    'a',
    'abbr',
    'article',
    'aside',
    'b',
    'blockquote',
    'br',
    'caption',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'div',
    'dl',
    'dt',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'li',
    'mark',
    'ol',
    'p',
    'picture',
    'pre',
    'section',
    'small',
    'source',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
] as const

const ALLOWED_REMOTE_HTML_ATTRIBUTES: Record<string, string[]> = {
    '*': ['aria-*', 'class', 'data-*', 'dir', 'id', 'lang', 'role', 'title'],
    a: ['href', 'name', 'rel', 'target'],
    col: ['span', 'width'],
    img: ['alt', 'height', 'loading', 'src', 'srcset', 'width'],
    pre: ['tabindex'],
    source: ['media', 'sizes', 'src', 'srcset', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
}

const REMOTE_HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [...ALLOWED_REMOTE_HTML_TAGS],
    allowedAttributes: ALLOWED_REMOTE_HTML_ATTRIBUTES,
    allowedSchemes: ['ftp', 'http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href', 'src', 'srcset'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'completelyDiscard',
    parser: {
        lowerCaseAttributeNames: true,
    },
    transformTags: {
        a: (tagName, attribs) => ({
            tagName,
            attribs:
                attribs.target === '_blank'
                    ? {
                          ...attribs,
                          rel: 'noopener noreferrer',
                      }
                    : attribs,
        }),
    },
}

const PLAIN_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
}

function decodeCommonHtmlEntities(value: string) {
    return value
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&amp;/gi, '&')
}

function extractSafeText(content: string) {
    return decodeCommonHtmlEntities(
        sanitizeHtml(content, PLAIN_TEXT_SANITIZE_OPTIONS)
    )
}

export function sanitizeRemoteHtml(content: string) {
    return sanitizeHtml(content, REMOTE_HTML_SANITIZE_OPTIONS)
}

export function stripHtmlToText(content: string) {
    return extractSafeText(content)
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function stripHtmlToCodeText(content: string) {
    return extractSafeText(content)
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .trim()
}

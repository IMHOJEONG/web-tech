const JS_KEYWORDS = new Set([
    'async',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'default',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'from',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'of',
    'return',
    'switch',
    'throw',
    'try',
    'type',
    'typeof',
    'var',
    'while',
])

const JS_LITERALS = new Set(['false', 'null', 'true', 'undefined'])

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function token(className: string, value: string) {
    return `<span class="mdx-code-token mdx-code-token--${className}">${escapeHtml(value)}</span>`
}

function highlightAttributes(value: string) {
    const attributePattern =
        /([A-Za-z_:][-A-Za-z0-9_:.]*)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>`]+)/g
    let highlighted = ''
    let lastIndex = 0

    for (const match of value.matchAll(attributePattern)) {
        const [raw, name, equals, attributeValue] = match
        const index = match.index ?? 0

        highlighted += escapeHtml(value.slice(lastIndex, index))
        highlighted += token('attribute', name ?? '')
        highlighted += escapeHtml(equals ?? '')
        highlighted += token('string', attributeValue ?? '')
        lastIndex = index + raw.length
    }

    highlighted += escapeHtml(value.slice(lastIndex))

    return highlighted
}

function highlightHtmlTag(value: string) {
    const match = value.match(/^(<\/?)([A-Za-z][^\s/>]*)([\s\S]*?)(\/?>)$/)

    if (!match) {
        return token('tag', value)
    }

    const [, open = '', name = '', attributes = '', close = ''] = match

    return [
        token('punctuation', open),
        token('tag', name),
        highlightAttributes(attributes),
        token('punctuation', close),
    ].join('')
}

function highlightHtml(code: string) {
    const htmlPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g
    let highlighted = ''
    let lastIndex = 0

    for (const match of code.matchAll(htmlPattern)) {
        const [raw] = match
        const index = match.index ?? 0

        highlighted += escapeHtml(code.slice(lastIndex, index))
        highlighted += raw.startsWith('<!--')
            ? token('comment', raw)
            : highlightHtmlTag(raw)
        lastIndex = index + raw.length
    }

    highlighted += escapeHtml(code.slice(lastIndex))

    return highlighted
}

function classifyJsToken(value: string) {
    if (value.startsWith('//') || value.startsWith('/*')) {
        return 'comment'
    }

    if (
        value.startsWith('"') ||
        value.startsWith("'") ||
        value.startsWith('`')
    ) {
        return 'string'
    }

    if (JS_KEYWORDS.has(value)) {
        return 'keyword'
    }

    if (JS_LITERALS.has(value)) {
        return 'literal'
    }

    if (/^\d/.test(value)) {
        return 'number'
    }

    return 'plain'
}

function highlightJsLike(code: string) {
    const jsPattern =
        /\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b/g
    let highlighted = ''
    let lastIndex = 0

    for (const match of code.matchAll(jsPattern)) {
        const [raw] = match
        const index = match.index ?? 0
        const kind = classifyJsToken(raw)

        highlighted += escapeHtml(code.slice(lastIndex, index))
        highlighted += kind === 'plain' ? escapeHtml(raw) : token(kind, raw)
        lastIndex = index + raw.length
    }

    highlighted += escapeHtml(code.slice(lastIndex))

    return highlighted
}

function highlightCss(code: string) {
    const cssPattern =
        /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[\da-fA-F]{3,8}\b|\b-?[0-9.]+(?:px|rem|em|%|vh|vw|s|ms)?\b|[A-Za-z-]+(?=\s*:)/g
    let highlighted = ''
    let lastIndex = 0

    for (const match of code.matchAll(cssPattern)) {
        const [raw] = match
        const index = match.index ?? 0
        const kind = raw.startsWith('/*')
            ? 'comment'
            : raw.startsWith('"') || raw.startsWith("'")
              ? 'string'
              : raw.startsWith('#') || /^\d|-?\./.test(raw)
                ? 'number'
                : 'property'

        highlighted += escapeHtml(code.slice(lastIndex, index))
        highlighted += token(kind, raw)
        lastIndex = index + raw.length
    }

    highlighted += escapeHtml(code.slice(lastIndex))

    return highlighted
}

export function highlightCode(code: string, language: string) {
    const normalizedLanguage = language.toLowerCase()

    if (['html', 'mdx', 'xml'].includes(normalizedLanguage)) {
        return highlightHtml(code)
    }

    if (['css', 'scss', 'sass'].includes(normalizedLanguage)) {
        return highlightCss(code)
    }

    if (
        ['js', 'jsx', 'javascript', 'ts', 'tsx', 'typescript', 'json'].includes(
            normalizedLanguage
        )
    ) {
        return highlightJsLike(code)
    }

    return escapeHtml(code)
}

const ALLOWED_REMOTE_HTML_TAGS = new Set([
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
])

const VOID_REMOTE_HTML_TAGS = new Set(['br', 'col', 'hr', 'img', 'source'])

const DANGEROUS_BLOCK_TAGS = [
    'base',
    'embed',
    'form',
    'iframe',
    'link',
    'math',
    'meta',
    'noscript',
    'object',
    'script',
    'style',
    'svg',
    'template',
    'textarea',
    'title',
]

const GLOBAL_ATTRIBUTES = new Set([
    'class',
    'dir',
    'id',
    'lang',
    'role',
    'title',
])

const TAG_ATTRIBUTES: Record<string, Set<string>> = {
    a: new Set(['href', 'name', 'rel', 'target']),
    col: new Set(['span', 'width']),
    img: new Set(['alt', 'height', 'loading', 'src', 'srcset', 'width']),
    pre: new Set(['tabindex']),
    source: new Set(['media', 'sizes', 'src', 'srcset', 'type']),
    td: new Set(['colspan', 'rowspan']),
    th: new Set(['colspan', 'rowspan', 'scope']),
}

const URL_ATTRIBUTES = new Set(['href', 'src'])

function removeDangerousBlocks(value: string) {
    return DANGEROUS_BLOCK_TAGS.reduce((content, tagName) => {
        const pairedPattern = new RegExp(
            `<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`,
            'gi'
        )
        const danglingPattern = new RegExp(
            `<${tagName}\\b[^>]*>[\\s\\S]*$`,
            'gi'
        )

        return content.replace(pairedPattern, '').replace(danglingPattern, '')
    }, value)
}

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function isAllowedAttribute(tagName: string, attributeName: string) {
    if (
        GLOBAL_ATTRIBUTES.has(attributeName) ||
        attributeName.startsWith('aria-') ||
        attributeName.startsWith('data-')
    ) {
        return true
    }

    return TAG_ATTRIBUTES[tagName]?.has(attributeName) ?? false
}

function hasBlockedScheme(value: string) {
    return /^[a-z][a-z0-9+.-]*:/i.test(value)
}

function removeControlCharacters(value: string) {
    return Array.from(value)
        .filter((char) => {
            const code = char.charCodeAt(0)

            return code > 31 && code !== 127
        })
        .join('')
}

function isSafeUrl(value: string) {
    const normalizedValue = removeControlCharacters(value.trim())

    if (!normalizedValue || normalizedValue.startsWith('//')) {
        return false
    }

    if (
        normalizedValue.startsWith('#') ||
        normalizedValue.startsWith('/') ||
        normalizedValue.startsWith('./') ||
        normalizedValue.startsWith('../')
    ) {
        return true
    }

    if (!hasBlockedScheme(normalizedValue)) {
        return true
    }

    try {
        const url = new URL(normalizedValue)

        return ['ftp:', 'http:', 'https:', 'mailto:'].includes(url.protocol)
    } catch {
        return false
    }
}

function isSafeSrcSet(value: string) {
    return value
        .split(',')
        .map((candidate) => candidate.trim().split(/\s+/)[0] ?? '')
        .every((url) => isSafeUrl(url))
}

function sanitizeAttributeValue(attributeName: string, value: string) {
    if (URL_ATTRIBUTES.has(attributeName) && !isSafeUrl(value)) {
        return null
    }

    if (attributeName === 'srcset' && !isSafeSrcSet(value)) {
        return null
    }

    return escapeAttribute(value)
}

function mergeLinkRel(value: string) {
    const relTokens = new Set(
        value
            .split(/\s+/)
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean)
    )

    relTokens.add('noopener')
    relTokens.add('noreferrer')

    return Array.from(relTokens).join(' ')
}

function sanitizeAttributes(tagName: string, rawAttributes: string) {
    const attributes: string[] = []
    const attributePattern =
        /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
    let linkRelIndex = -1
    let hasBlankTarget = false

    for (const match of rawAttributes.matchAll(attributePattern)) {
        const [, rawName = '', doubleQuoted, singleQuoted, unquoted] = match
        const attributeName = rawName.toLowerCase()
        const rawValue = doubleQuoted ?? singleQuoted ?? unquoted

        if (
            !rawValue ||
            attributeName === '/' ||
            attributeName.startsWith('on') ||
            !isAllowedAttribute(tagName, attributeName)
        ) {
            continue
        }

        const value = sanitizeAttributeValue(attributeName, rawValue)

        if (value === null) {
            continue
        }

        if (
            tagName === 'a' &&
            attributeName === 'target' &&
            value === '_blank'
        ) {
            hasBlankTarget = true
        }

        if (tagName === 'a' && attributeName === 'rel') {
            linkRelIndex = attributes.length
        }

        attributes.push(`${attributeName}="${value}"`)
    }

    if (tagName === 'a' && hasBlankTarget) {
        if (linkRelIndex >= 0) {
            const relValue =
                attributes[linkRelIndex]?.match(/^rel="(.*)"$/)?.[1]

            attributes[linkRelIndex] = `rel="${mergeLinkRel(relValue ?? '')}"`
        } else {
            attributes.push('rel="noopener noreferrer"')
        }
    }

    return attributes.length > 0 ? ` ${attributes.join(' ')}` : ''
}

export function sanitizeRemoteHtml(content: string) {
    const withoutDangerousBlocks = removeDangerousBlocks(content)
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<!doctype[^>]*>/gi, '')

    return withoutDangerousBlocks.replace(
        /<\/?\s*([a-z][a-z0-9:-]*)\b([^<>]*)>/gi,
        (match, rawTagName: string, rawAttributes: string) => {
            const tagName = rawTagName.toLowerCase()

            if (!ALLOWED_REMOTE_HTML_TAGS.has(tagName)) {
                return ''
            }

            if (/^<\s*\//.test(match)) {
                return VOID_REMOTE_HTML_TAGS.has(tagName) ? '' : `</${tagName}>`
            }

            const attributes = sanitizeAttributes(tagName, rawAttributes)

            return `<${tagName}${attributes}>`
        }
    )
}

export function stripHtmlToText(content: string) {
    return removeDangerousBlocks(content)
        .replace(/<[^>]*>/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function stripHtmlToCodeText(content: string) {
    return removeDangerousBlocks(content)
        .replace(/<[^>]*>/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .trim()
}

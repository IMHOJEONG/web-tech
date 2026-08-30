import sanitizeHtml from 'sanitize-html'
import type { HeadingDepth, TocItem } from 'remark-flexible-toc'
import {
    getCalloutLabel,
    getCalloutVariantFromText,
    type CalloutVariant,
} from '../../../feature/callout/model/callout.ts'
import { highlightCode } from '../../../feature/code-block/lib/highlight-code.ts'
import { slugifyHeading } from '../../../lib/slugify-heading.ts'

function normalizePlainText(value: string) {
    return value
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

function toPlainText(value: string) {
    return normalizePlainText(
        sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
            disallowedTagsMode: 'discard',
        })
    )
}

function toCodeText(value: string) {
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
    })
        .replace(/\u00a0/g, ' ')
        .replace(/\r\n?/g, '\n')
        .trim()
}

function escapeAttribute(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function inferCodeLanguage(rawAttributes: string) {
    const languageClass = rawAttributes
        .match(/\bclass=(["'])(.*?)\1/i)?.[2]
        ?.split(/\s+/)
        .find((className) => className.startsWith('language-'))
        ?.replace('language-', '')
        .trim()

    if (languageClass) {
        return languageClass
    }

    const dataLanguage = rawAttributes
        .match(/\bdata-language=(["'])(.*?)\1/i)?.[2]
        ?.trim()

    return dataLanguage || 'code'
}

function normalizeCodeLanguage(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function normalizeRemoteCodeBlocks(content: string) {
    return content.replace(
        /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
        (_match, preAttributes: string, codeAttributes: string, innerHtml) => {
            const language = inferCodeLanguage(
                `${preAttributes} ${codeAttributes}`
            )
            const normalizedLanguage = normalizeCodeLanguage(language) || 'code'
            const code = toCodeText(innerHtml)
            const highlightedCode = highlightCode(code, normalizedLanguage)
            const languageLabel = escapeAttribute(
                normalizedLanguage.toUpperCase()
            )

            return `<figure class="mdx-code-frame"><pre class="mdx-code-block"><code class="mdx-code-block__code language-${escapeAttribute(
                normalizedLanguage
            )}">${highlightedCode}</code></pre><figcaption class="mdx-code-frame__language">${languageLabel}</figcaption></figure>`
        }
    )
}

function appendClassName(rawAttributes: string, className: string) {
    const classNameMatch = rawAttributes.match(/\sclass=(["'])(.*?)\1/i)

    if (!classNameMatch) {
        return `${rawAttributes} class="${className}"`
    }

    const [attribute, quote, matchedClassName] = classNameMatch
    const currentClassName = matchedClassName ?? ''

    if (currentClassName.split(/\s+/).includes(className)) {
        return rawAttributes
    }

    return rawAttributes.replace(
        attribute,
        ` class=${quote}${currentClassName} ${className}${quote}`
    )
}

function normalizeRemoteTables(content: string) {
    return content.replace(
        /<table([^>]*)>([\s\S]*?)<\/table>/gi,
        (_match, rawAttributes: string, innerHtml: string) => {
            const attributes = appendClassName(rawAttributes, 'mdx-table')

            return `<div class="mdx-table-scroll" role="region" aria-label="문서 표" tabindex="0"><table${attributes}>${innerHtml}</table></div>`
        }
    )
}

function normalizeRemoteBlockquotes(content: string) {
    return content.replace(
        /<blockquote([^>]*)>/gi,
        (_match, rawAttributes: string) =>
            `<blockquote${appendClassName(rawAttributes, 'mdx-blockquote')}>`
    )
}

function getRemoteCalloutVariant(innerHtml: string): CalloutVariant | null {
    const text = toPlainText(innerHtml)
    return getCalloutVariantFromText(text)
}

function stripRemoteCalloutMarker(innerHtml: string) {
    return innerHtml
        .replace(/(<p[^>]*>\s*)?\[!(NOTE|WARNING|TIP)\]\s*/i, '$1')
        .replace(/<p[^>]*>\s*<\/p>/i, '')
}

function normalizeRemoteCallouts(content: string) {
    return content.replace(
        /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
        (match, innerHtml: string) => {
            const variant = getRemoteCalloutVariant(innerHtml)

            if (!variant) {
                return match
            }

            const label = getCalloutLabel(variant)
            const body = stripRemoteCalloutMarker(innerHtml)

            return `<aside class="mdx-callout mdx-callout--${variant}" role="note" aria-label="${label}"><p class="mdx-callout__label">${label}</p><div class="mdx-callout__content">${body}</div></aside>`
        }
    )
}

export function normalizeRemoteArticleHtml(content: string) {
    const toc: TocItem[] = []

    const normalizedContentBlocks = normalizeRemoteBlockquotes(
        normalizeRemoteCallouts(
            normalizeRemoteTables(normalizeRemoteCodeBlocks(content))
        )
    )

    const normalizedContent = normalizedContentBlocks.replace(
        /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (match, depthValue, rawAttributes, innerHtml) => {
            const depth = Number(depthValue) as HeadingDepth
            const value = toPlainText(innerHtml)

            if (!value) {
                return match
            }

            const existingIdMatch = rawAttributes.match(/\sid=(["'])(.*?)\1/i)
            const id = existingIdMatch?.[2]?.trim() || slugifyHeading(value)
            const attributes = existingIdMatch
                ? rawAttributes
                : `${rawAttributes} id="${id}"`

            toc.push({
                value,
                depth,
                href: `#${id}`,
                numbering: [],
                parent: 'root',
            })

            return `<h${depth}${attributes}>${innerHtml}</h${depth}>`
        }
    )

    return {
        content: normalizedContent,
        toc,
    }
}

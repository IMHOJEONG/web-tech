import type { HeadingDepth, TocItem } from 'remark-flexible-toc'
import { highlightCode } from '../../../feature/code-block/lib/highlight-code.ts'
import { slugifyHeading } from '../../../lib/slugify-heading.ts'

function stripHeadingMarkup(value: string) {
    return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
}

function stripHtmlTags(value: string) {
    return value.replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(value: string) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
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
            const code = decodeHtmlEntities(stripHtmlTags(innerHtml))
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

export function normalizeRemoteArticleHtml(content: string) {
    const toc: TocItem[] = []

    const normalizedCodeContent = normalizeRemoteCodeBlocks(content)

    const normalizedContent = normalizedCodeContent.replace(
        /<h([1-4])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (match, depthValue, rawAttributes, innerHtml) => {
            const depth = Number(depthValue) as HeadingDepth
            const value = stripHeadingMarkup(innerHtml)

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

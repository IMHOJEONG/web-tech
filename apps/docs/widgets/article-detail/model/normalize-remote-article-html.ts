import { HeadingDepth, TocItem } from 'remark-flexible-toc'
import { slugifyHeading } from '~/mdx-components'

function stripHeadingMarkup(value: string) {
    return value
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
}

export function normalizeRemoteArticleHtml(content: string) {
    const toc: TocItem[] = []

    const normalizedContent = content.replace(
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

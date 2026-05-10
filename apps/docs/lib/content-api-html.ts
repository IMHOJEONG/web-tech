import sanitizeHtml from 'sanitize-html'
import type { ContentFormat } from '~/lib/content-api-types'

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
    img: ['alt', 'height', 'loading', 'src', 'srcset', 'width'],
    source: ['media', 'sizes', 'src', 'srcset', 'type'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    col: ['span', 'width'],
}

function inferContentFormat(
    content: string,
    contentType?: string | null
): ContentFormat {
    if (contentType?.toLowerCase().includes('text/html')) {
        return 'html'
    }

    const trimmedContent = content.trim()

    if (
        /^<!doctype html/i.test(trimmedContent) ||
        /^<html[\s>]/i.test(trimmedContent) ||
        /^<article[\s>]/i.test(trimmedContent) ||
        /^<section[\s>]/i.test(trimmedContent) ||
        /^<div[\s>]/i.test(trimmedContent) ||
        /^<h[1-6][\s>]/i.test(trimmedContent)
    ) {
        return 'html'
    }

    return 'mdx'
}

function promoteImageCaptionParagraph(content: string) {
    return content.replace(
        /<p>\s*(<img\b[^>]*>)\s*<em>([\s\S]*?)<\/em>\s*<\/p>/gi,
        (_match, imageTag: string, caption: string) =>
            `<figure>${imageTag}<figcaption>${caption.trim()}</figcaption></figure>`
    )
}

function sanitizeRemoteHtml(content: string) {
    return sanitizeHtml(content, {
        allowedTags: [...ALLOWED_REMOTE_HTML_TAGS],
        allowedAttributes: ALLOWED_REMOTE_HTML_ATTRIBUTES,
        disallowedTagsMode: 'discard',
        allowedSchemes: ['http', 'https', 'mailto', 'ftp'],
        allowedSchemesAppliedToAttributes: ['href', 'src', 'srcset'],
        allowProtocolRelative: false,
        parser: {
            lowerCaseAttributeNames: true,
        },
        transformTags: {
            a: (tagName, attribs) => {
                const sanitizedAttribs = { ...attribs }

                if (sanitizedAttribs.target === '_blank') {
                    sanitizedAttribs.rel = 'noopener noreferrer'
                }

                return {
                    tagName,
                    attribs: sanitizedAttribs,
                }
            },
        },
    })
}

export function normalizeRemoteContent(
    content: string,
    contentType?: string | null
): { content: string; contentFormat: ContentFormat } | null {
    const detectedContentFormat = inferContentFormat(content, contentType)

    if (detectedContentFormat !== 'html') {
        return null
    }

    const normalizedFigureContent = promoteImageCaptionParagraph(content)

    return {
        content: sanitizeRemoteHtml(normalizedFigureContent),
        contentFormat: 'html',
    }
}

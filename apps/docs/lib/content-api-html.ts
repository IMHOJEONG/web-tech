import type { ContentFormat } from '~/lib/content-api-types'
import { sanitizeRemoteHtml } from './remote-html-sanitizer.ts'

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

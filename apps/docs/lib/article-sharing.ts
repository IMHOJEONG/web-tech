import type { Metadata as Article } from './document.types.ts'
import { getDocHref } from './get-doc-route.ts'
import {
    getMetadataBase,
    normalizeMetadataImageUrl,
    toAbsoluteSiteUrl,
} from './seo.ts'
import { localizePath, type AppLocale } from '../shared/i18n/locale-path.ts'

export type ArticleSharingSource = Pick<
    Partial<Article>,
    | 'title'
    | 'summary'
    | 'slug'
    | 'markdownPath'
    | 'fileName'
    | 'thumbnail'
    | 'date'
    | 'updatedAt'
    | 'authorName'
    | 'topicLabel'
    | 'tags'
>

export function normalizeOgText(
    value: string | null | undefined,
    limit: number,
    fallback = ''
) {
    const text = Array.from((value ?? '').normalize('NFC'), (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
            ? ' '
            : character
    )
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
    const characters = Array.from(text || fallback)
    return characters.length > limit
        ? `${characters.slice(0, limit - 1).join('')}…`
        : characters.join('')
}

export function getArticleOgImageUrl(
    article: ArticleSharingSource,
    siteUrl = getMetadataBase()
) {
    const url = new URL('/og/article.png', siteUrl)
    url.searchParams.set('v', '1')
    url.searchParams.set(
        'title',
        normalizeOgText(article.title, 90, 'HEAP-FORGE')
    )
    const topic = normalizeOgText(article.topicLabel, 28)
    const author = normalizeOgText(article.authorName, 32)
    if (topic) url.searchParams.set('topic', topic)
    if (author) url.searchParams.set('author', author)
    return url.toString()
}

function validDate(value?: string) {
    if (
        !value ||
        !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
            value
        )
    )
        return undefined
    const date = new Date(value)
    if (!Number.isFinite(date.getTime())) return undefined
    const calendarDate = value.slice(0, 10)
    if (
        new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) !==
        calendarDate
    )
        return undefined
    return value
}

export function buildArticleJsonLd(
    article: ArticleSharingSource,
    locale: AppLocale,
    siteUrl = getMetadataBase()
) {
    const url = toAbsoluteSiteUrl(
        localizePath(getDocHref(article), locale),
        siteUrl
    )
    const datePublished = validDate(article.date)
    const author = article.authorName?.trim()
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        headline: article.title ?? 'HEAP-FORGE',
        description: article.summary || undefined,
        image: [
            article.thumbnail?.trim()
                ? normalizeMetadataImageUrl(article.thumbnail, siteUrl)
                : getArticleOgImageUrl(article, siteUrl),
        ],
        datePublished,
        dateModified: validDate(article.updatedAt) ?? datePublished,
        author: author ? { '@type': 'Person', name: author } : undefined,
        publisher: {
            '@type': 'Organization',
            name: 'HEAP-FORGE',
            url: siteUrl.origin,
        },
        articleSection: article.topicLabel || undefined,
        keywords: article.tags?.length ? article.tags.join(', ') : undefined,
    }
}

export function serializeJsonLd(value: ReturnType<typeof buildArticleJsonLd>) {
    return JSON.stringify(value).replace(/</g, '\\u003c')
}

import type { Metadata as NextMetadata } from 'next'
import type { Metadata as Article } from '~/lib/get-document'
import { getDocHref } from './get-doc-route.ts'
import { getMetadataBase, toAbsoluteSiteUrl } from './seo.ts'

const DEFAULT_OG_IMAGE_PATH = '/og-image.png'

function normalizeMetadataImageUrl(
    imageUrl?: string | null,
    siteUrl = getMetadataBase()
) {
    const trimmedImageUrl = imageUrl?.trim()

    if (!trimmedImageUrl) {
        return toAbsoluteSiteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)
    }

    if (/^\/\//.test(trimmedImageUrl)) {
        return `https:${trimmedImageUrl}`
    }

    if (/^https?:\/\//i.test(trimmedImageUrl)) {
        return trimmedImageUrl
    }

    return toAbsoluteSiteUrl(trimmedImageUrl, siteUrl)
}

export function buildArticleMetadata(
    article: Pick<
        Partial<Article>,
        | 'authorName'
        | 'date'
        | 'fileName'
        | 'markdownPath'
        | 'slug'
        | 'summary'
        | 'tags'
        | 'thumbnail'
        | 'title'
        | 'topicLabel'
        | 'updatedAt'
    >,
    siteUrl = getMetadataBase()
): NextMetadata {
    const canonicalPath = getDocHref(article)
    const canonicalUrl = toAbsoluteSiteUrl(canonicalPath, siteUrl)
    const title = article.title ?? 'HeapForge 문서'
    const description =
        article.summary ?? 'HeapForge에서 정리한 기술 문서입니다.'
    const imageUrl = normalizeMetadataImageUrl(article.thumbnail, siteUrl)

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        authors: article.authorName ? [{ name: article.authorName }] : [],
        keywords: article.tags,
        openGraph: {
            type: 'article',
            title,
            description,
            url: canonicalUrl,
            images: [imageUrl],
            publishedTime: article.date,
            modifiedTime: article.updatedAt ?? article.date,
            authors: article.authorName ? [article.authorName] : undefined,
            tags: article.tags,
            section: article.topicLabel,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    }
}

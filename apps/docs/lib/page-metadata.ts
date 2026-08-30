import type { Metadata as NextMetadata } from 'next'
import {
    getMetadataBase,
    normalizeMetadataImageUrl,
    toAbsoluteSiteUrl,
} from './seo.ts'

type PageMetadataInput = {
    title: string
    description: string
    pathname: string
    image?: string | null
    ogDescription?: string
    ogTitle?: string
}

export function buildPageMetadata(
    {
        title,
        description,
        pathname,
        image,
        ogDescription,
        ogTitle,
    }: PageMetadataInput,
    siteUrl = getMetadataBase()
): NextMetadata {
    const canonicalUrl = toAbsoluteSiteUrl(pathname, siteUrl)
    const imageUrl = normalizeMetadataImageUrl(image, siteUrl)
    const resolvedOgTitle = ogTitle ?? title
    const resolvedOgDescription = ogDescription ?? description

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            type: 'website',
            title: resolvedOgTitle,
            description: resolvedOgDescription,
            url: canonicalUrl,
            images: [imageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title: resolvedOgTitle,
            description: resolvedOgDescription,
            images: [imageUrl],
        },
    }
}

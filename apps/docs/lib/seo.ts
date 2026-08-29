const DEFAULT_SITE_URL = 'https://heap-forge.app'
export const DEFAULT_OG_IMAGE_PATH = '/og-image.png'

export const STATIC_SITEMAP_PATHS = [
    '/',
    '/feed',
    '/docs',
    '/web',
    '/mobile',
    '/ui-ux',
    '/category',
    '/about',
    '/privacy',
    '/terms',
    '/changelog',
] as const

export function getSiteUrl() {
    const rawSiteUrl =
        process.env.DOCS_SITE_URL?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        DEFAULT_SITE_URL

    try {
        return new URL(rawSiteUrl)
    } catch {
        return new URL(DEFAULT_SITE_URL)
    }
}

export function getMetadataBase() {
    return new URL(getSiteUrl().origin)
}

export function toAbsoluteSiteUrl(pathname: string, siteUrl = getSiteUrl()) {
    return new URL(pathname, siteUrl).toString()
}

export function normalizeMetadataImageUrl(
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

export function getStaticSitemapEntries(siteUrl = getSiteUrl()) {
    return STATIC_SITEMAP_PATHS.map((pathname) => ({
        url: toAbsoluteSiteUrl(pathname, siteUrl),
        priority: pathname === '/' ? 1 : 0.75,
    }))
}

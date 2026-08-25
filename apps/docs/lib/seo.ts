const DEFAULT_SITE_URL = 'https://heap-forge.app'

export const STATIC_SITEMAP_PATHS = [
    '/',
    '/feed',
    '/docs',
    '/web',
    '/mobile',
    '/ui-ux',
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

export function toAbsoluteSiteUrl(pathname: string, siteUrl = getSiteUrl()) {
    return new URL(pathname, siteUrl).toString()
}

export function getStaticSitemapEntries(siteUrl = getSiteUrl()) {
    return STATIC_SITEMAP_PATHS.map((pathname) => ({
        url: toAbsoluteSiteUrl(pathname, siteUrl),
        priority: pathname === '/' ? 1 : 0.75,
    }))
}

import type { MetadataRoute } from 'next'
import { getSiteUrl, toAbsoluteSiteUrl } from '~/lib/seo'

export default function robots(): MetadataRoute.Robots {
    const siteUrl = getSiteUrl()

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/_next/', '/open/'],
            },
        ],
        sitemap: toAbsoluteSiteUrl('/sitemap.xml', siteUrl),
        host: siteUrl.origin,
    }
}

import type { MetadataRoute } from 'next'
import { getSearchData } from '~/lib/get-search-data'
import { locales, localizePath } from '~/shared/i18n/locale-path'
import {
    getSiteUrl,
    getStaticSitemapEntries,
    toAbsoluteSiteUrl,
} from '~/lib/seo'

// Retry generation even when a transient upstream failure produced a local-only sitemap.
export const revalidate = 300

function toLastModified(date?: string) {
    if (!date) {
        return undefined
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return parsedDate
}

function dedupeSitemapEntries(entries: MetadataRoute.Sitemap) {
    const seenUrls = new Set<string>()

    return entries.filter((entry) => {
        if (seenUrls.has(entry.url)) {
            return false
        }

        seenUrls.add(entry.url)
        return true
    })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = getSiteUrl()
    const staticEntries = getStaticSitemapEntries(siteUrl).map((entry) => ({
        ...entry,
        changeFrequency: 'weekly' as const,
    }))
    const docs = await getSearchData()
    const docEntries = docs.map((doc) => ({
        url: toAbsoluteSiteUrl(doc.href, siteUrl),
        lastModified: toLastModified(doc.updatedAt) ?? toLastModified(doc.date),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
    }))

    return dedupeSitemapEntries(
        [...staticEntries, ...docEntries].flatMap((entry) => {
            const pathname = new URL(entry.url).pathname
            const languages = Object.fromEntries(
                locales.map((locale) => [
                    locale,
                    toAbsoluteSiteUrl(localizePath(pathname, locale), siteUrl),
                ])
            )
            return locales.map((locale) => ({
                ...entry,
                url: languages[locale]!,
                alternates: { languages },
            }))
        })
    )
}

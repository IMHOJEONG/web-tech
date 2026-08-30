import type { MetadataRoute } from 'next'
import { getSearchData } from '~/lib/get-search-data'
import {
    getSiteUrl,
    getStaticSitemapEntries,
    toAbsoluteSiteUrl,
} from '~/lib/seo'

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
    const localDocs = await getSearchData(undefined, { includeRemote: false })
    const localDocEntries = localDocs.map((doc) => ({
        url: toAbsoluteSiteUrl(doc.href, siteUrl),
        lastModified: toLastModified(doc.date),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
    }))

    return dedupeSitemapEntries([...staticEntries, ...localDocEntries])
}

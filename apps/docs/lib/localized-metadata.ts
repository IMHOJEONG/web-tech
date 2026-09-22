import { getLocale } from 'next-intl/server'
import { buildPageMetadata as buildPage } from './page-metadata'
import { buildArticleMetadata as buildArticle } from './article-metadata'
import { getDocHref } from './get-doc-route'
import { getMetadataBase, toAbsoluteSiteUrl } from './seo'
import {
    defaultLocale,
    isLocale,
    locales,
    localizePath,
} from '~/shared/i18n/locale-path'

async function localize(
    metadata: ReturnType<typeof buildPage>,
    pathname: string
) {
    const value = await getLocale()
    const locale = isLocale(value) ? value : defaultLocale
    const canonical = toAbsoluteSiteUrl(
        localizePath(pathname, locale),
        getMetadataBase()
    )
    return {
        ...metadata,
        alternates: {
            canonical,
            languages: Object.fromEntries(
                locales.map((language) => [
                    language,
                    toAbsoluteSiteUrl(localizePath(pathname, language)),
                ])
            ),
        },
        openGraph: { ...metadata.openGraph, url: canonical },
    }
}

export async function buildPageMetadata(
    input: Parameters<typeof buildPage>[0]
) {
    return localize(buildPage(input), input.pathname)
}

export async function buildArticleMetadata(
    input: Parameters<typeof buildArticle>[0]
) {
    return localize(buildArticle(input), getDocHref(input))
}

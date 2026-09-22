import 'server-only'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { getSortedPostsData } from '~/lib/get-document'
import type { ArticleSupplementaryProps } from './article-content.types'
import { buildArticleRelatedDocuments } from '~/lib/article-related-documents'
import { buildArticleReadingNavigation } from '~/lib/article-reading-navigation'
import { ArticleRelatedDocuments } from './article-related-documents'
import { ArticleReadingNavigation } from './article-reading-navigation'

const getNavigationDocs = cache((includeRemote: boolean) =>
    getSortedPostsData({ includeRemote })
)

export async function ArticleSupplementary({
    target,
    measure,
}: ArticleSupplementaryProps) {
    // Only data preparation is caught; the article itself must remain readable.
    const data = await (async () => {
        try {
            const docs = await measure('navigation-load', () =>
                getNavigationDocs(target.contentSource === 'remote')
            )
            return await measure('navigation-build', () => ({
                related: buildArticleRelatedDocuments(docs, target),
                navigation: buildArticleReadingNavigation(docs, target),
            }))
        } catch {
            console.warn(
                '[docs.article_supplementary] Unavailable; preserving article body.'
            )
            return null
        }
    })()

    if (!data) return null
    const t = await getTranslations('articleDetail')

    return (
        <div data-testid="article-supplementary">
            <ArticleRelatedDocuments
                items={data.related}
                labels={{
                    description: t('relatedDocuments.description'),
                    sectionTitle: t('relatedDocuments.sectionTitle'),
                }}
            />
            <ArticleReadingNavigation
                navigation={data.navigation}
                labels={{
                    lastUpdated: t('readingNavigation.lastUpdated'),
                    next: t('readingNavigation.next'),
                    previous: t('readingNavigation.previous'),
                    sectionTitle: t('readingNavigation.sectionTitle'),
                }}
            />
        </div>
    )
}

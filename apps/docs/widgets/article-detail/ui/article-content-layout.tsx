import type { TocItem } from 'remark-flexible-toc'
import Toc from '~/widgets/article-toc/ui/toc'
import { getTranslations } from 'next-intl/server'
import type { ArticleRelatedDocumentItem } from '~/lib/article-related-documents'
import type { ArticleReadingNavigation as ArticleReadingNavigationData } from '~/lib/article-reading-navigation'
import { ArticleRelatedDocuments } from './article-related-documents'
import { ArticleReadingNavigation } from './article-reading-navigation'
import { ArticleContentGrid } from './article-content-grid'

export async function ArticleContentLayout({
    relatedDocuments,
    toc,
    readingNavigation,
    children,
}: {
    relatedDocuments?: ArticleRelatedDocumentItem[]
    toc?: TocItem[]
    readingNavigation?: ArticleReadingNavigationData
    children: React.ReactNode
}) {
    const t = await getTranslations('articleDetail')

    return (
        <ArticleContentGrid>
            <aside className="hidden lg:block">
                <div className="sticky top-[4.75rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-background/98 px-5 py-4">
                    <Toc toc={toc} title={t('sidebar.tocTitle')} />
                </div>
            </aside>

            <div className="min-w-0">
                {children}
                {relatedDocuments && (
                    <ArticleRelatedDocuments
                        items={relatedDocuments}
                        labels={{
                            description: t('relatedDocuments.description'),
                            sectionTitle: t('relatedDocuments.sectionTitle'),
                        }}
                    />
                )}
                {readingNavigation && (
                    <ArticleReadingNavigation
                        navigation={readingNavigation}
                        labels={{
                            lastUpdated: t('readingNavigation.lastUpdated'),
                            next: t('readingNavigation.next'),
                            previous: t('readingNavigation.previous'),
                            sectionTitle: t('readingNavigation.sectionTitle'),
                        }}
                    />
                )}
            </div>
        </ArticleContentGrid>
    )
}

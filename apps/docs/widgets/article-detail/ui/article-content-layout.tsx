import type { ArticleContentLayoutProps } from './article-content.types'
import { MainContent } from '~/shared/ui/main-content'
import Toc from '~/widgets/article-toc/ui/toc'
import { filterTocItems } from '~/widgets/article-toc/model/toc-items'
import { getTranslations } from 'next-intl/server'
import { ArticleContentGrid } from './article-content-grid'
import { ArticleSupplementaryBoundary } from './article-supplementary-boundary'

export async function ArticleContentLayout({
    fallbackTitle,
    supplementary,
    toc,
    children,
}: ArticleContentLayoutProps) {
    const t = await getTranslations('articleDetail')
    const common = await getTranslations('common')
    const visibleToc = filterTocItems(toc)

    return (
        <ArticleContentGrid>
            {visibleToc.length > 0 && (
                <aside className="hidden min-w-0 lg:block">
                    <div className="sticky top-[calc(var(--docs-header-height,4.0625rem)+0.6875rem)] min-w-0 py-2 pe-3">
                        <Toc toc={toc} title={t('sidebar.tocTitle')} />
                    </div>
                </aside>
            )}

            <MainContent
                className={
                    visibleToc.length ? 'min-w-0' : 'min-w-0 lg:col-span-2'
                }
            >
                {fallbackTitle && (
                    <h1 className="mdx-h1 mb-6 font-display text-on-surface">
                        {fallbackTitle}
                    </h1>
                )}
                {visibleToc.length > 0 && (
                    <div
                        data-testid="article-mobile-toc"
                        className="mb-6 min-w-0 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-1 lg:hidden"
                    >
                        <Toc
                            toc={toc}
                            title={t('sidebar.tocTitle')}
                            defaultOpen={false}
                            closeOnNavigate
                        />
                    </div>
                )}
                {children}
                {supplementary && (
                    <ArticleSupplementaryBoundary
                        loadingLabel={common('loadingDocuments')}
                    >
                        {supplementary}
                    </ArticleSupplementaryBoundary>
                )}
            </MainContent>
        </ArticleContentGrid>
    )
}

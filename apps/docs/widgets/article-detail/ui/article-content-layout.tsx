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
            <aside className="hidden lg:block">
                <div className="sticky top-[calc(var(--docs-header-height,4.0625rem)+0.6875rem)] max-h-[calc(100dvh-var(--docs-header-height,4.0625rem)-1.4375rem)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-background/98 px-5 py-4">
                    <Toc toc={toc} title={t('sidebar.tocTitle')} />
                </div>
            </aside>

            <MainContent className="min-w-0">
                {fallbackTitle && (
                    <h1 className="mdx-h1 mb-6 font-display text-on-surface">
                        {fallbackTitle}
                    </h1>
                )}
                {visibleToc.length > 0 && (
                    <div
                        data-testid="article-mobile-toc"
                        className="mb-6 border-b border-border pb-2 lg:hidden"
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

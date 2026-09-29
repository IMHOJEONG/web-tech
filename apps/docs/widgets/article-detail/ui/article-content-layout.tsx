import type { ArticleContentLayoutProps } from './article-content.types'
import { MainContent } from '~/shared/ui/main-content'
import Toc from '~/widgets/article-toc/ui/toc'
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

    return (
        <ArticleContentGrid>
            <aside className="hidden lg:block">
                <div className="sticky top-[4.75rem] max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-xl border border-outline-variant/60 bg-background/98 px-5 py-4">
                    <Toc toc={toc} title={t('sidebar.tocTitle')} />
                </div>
            </aside>

            <MainContent className="min-w-0">
                {fallbackTitle && (
                    <h1 className="mdx-h1 mb-6 font-display text-on-surface">
                        {fallbackTitle}
                    </h1>
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

import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { ArticleContentGrid } from './article-content-grid'

export async function ArticlePending() {
    const t = await getTranslations('common')
    return (
        <MainContent aria-busy="true" data-testid="article-pending">
            <span role="status" className="sr-only">
                {t('loadingDocuments')}
            </span>
            <ArticleContentGrid>
                <div
                    aria-hidden="true"
                    className="hidden self-start space-y-4 rounded-xl border border-outline-variant/60 bg-background px-5 py-4 lg:block"
                >
                    <div className="h-4 w-2/3 rounded bg-surface-container-low" />
                    <div className="h-4 w-full rounded bg-surface-container-low" />
                    <div className="h-4 w-3/4 rounded bg-surface-container-low" />
                </div>
                <div
                    aria-hidden="true"
                    className="min-w-0 space-y-8 motion-safe:animate-pulse"
                >
                    <div className="h-10 w-3/4 rounded bg-surface-container-low" />
                    {[0, 1, 2].map((section) => (
                        <div key={section} className="space-y-4">
                            <div className="h-6 w-1/2 rounded bg-surface-container-low" />
                            <div className="h-4 w-full rounded bg-surface-container-low" />
                            <div className="h-4 w-full rounded bg-surface-container-low" />
                            <div className="h-4 w-3/4 rounded bg-surface-container-low" />
                        </div>
                    ))}
                </div>
            </ArticleContentGrid>
        </MainContent>
    )
}

import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import { ArticleContentGrid } from './article-content-grid'
import { ArticleBodySkeleton } from './article-body-skeleton'

export function ArticlePending() {
    return (
        <MainContent
            aria-busy="true"
            data-testid="article-pending"
            data-page-pending="article"
        >
            <PendingStatus />
            <ArticleContentGrid>
                <div
                    aria-hidden="true"
                    className="hidden self-start space-y-4 rounded-xl border border-outline-variant/60 bg-background px-5 py-4 motion-safe:animate-pulse lg:block"
                >
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-3/4" />
                </div>
                <ArticleBodySkeleton />
            </ArticleContentGrid>
        </MainContent>
    )
}

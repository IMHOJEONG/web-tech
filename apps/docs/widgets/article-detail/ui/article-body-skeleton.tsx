import { SkeletonBlock } from '~/shared/ui/skeleton-block'

export function ArticleBodySkeleton() {
    return (
        <div
            aria-hidden="true"
            data-skeleton-anchor="article-body"
            className="min-w-0 space-y-8 motion-safe:animate-pulse"
        >
            <SkeletonBlock className="h-10 w-3/4" />
            {[0, 1, 2].map((section) => (
                <div key={section} className="space-y-4">
                    <SkeletonBlock className="h-6 w-1/2" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-3/4" />
                </div>
            ))}
        </div>
    )
}

/** @jsxImportSource react */
import { Suspense } from 'react'
import type { ArticleSupplementaryBoundaryProps } from './article-content.types'

export function ArticleSupplementaryBoundary({
    children,
    loadingLabel,
}: ArticleSupplementaryBoundaryProps) {
    return (
        <Suspense
            fallback={
                <div
                    role="status"
                    aria-busy="true"
                    data-testid="article-supplementary-pending"
                    className="mt-12 rounded-3xl border border-border bg-surface-container-lowest p-5 md:mt-14 md:p-6"
                >
                    <span className="sr-only">{loadingLabel}</span>
                    <div
                        aria-hidden="true"
                        className="space-y-3 motion-safe:animate-pulse"
                    >
                        <div className="h-4 w-32 rounded bg-surface-container-low" />
                        <div className="h-16 rounded-2xl bg-surface-container-low" />
                        <div className="h-16 rounded-2xl bg-surface-container-low" />
                    </div>
                </div>
            }
        >
            {children}
        </Suspense>
    )
}

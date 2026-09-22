import type { ReactNode } from 'react'

export function ArticlePageShell({ children }: { children: ReactNode }) {
    return (
        // Keep the footer below the first viewport even while the article streams.
        <div
            className="min-h-[calc(100svh-4.0625rem)] p-3"
            data-testid="article-page-shell"
        >
            <div className="prose">{children}</div>
        </div>
    )
}

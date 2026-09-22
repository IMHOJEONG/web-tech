import type { ReactNode } from 'react'

export function ArticleContentGrid({ children }: { children: ReactNode }) {
    return (
        <div className="mx-auto grid w-full max-w-page gap-6 px-4 pb-16 pt-2 sm:px-6 md:px-8 md:pt-3 lg:gap-8 lg:pb-20 lg:pt-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            {children}
        </div>
    )
}

'use client'

import NextTopLoader from 'nextjs-toploader'

export function AppTopLoader() {
    return (
        <NextTopLoader
            color="var(--primary)"
            height={2}
            shadow={false}
            showSpinner={false}
            speed={260}
            crawlSpeed={180}
            showForHashAnchor={false}
        />
    )
}

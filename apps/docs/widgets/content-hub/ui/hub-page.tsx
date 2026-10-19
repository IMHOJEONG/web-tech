import type { ReactNode } from 'react'
import { MainContent } from '~/shared/ui/main-content'
import { Link } from '~/shared/i18n/navigation'
import MainCard from '~/entities/document/ui/main-card'
import type { SearchData } from '~/lib/get-search-data'
import { HubHeader } from './hub-header'

type HubPageProps = {
    eyebrow: string
    title: string
    description: string
    stats: Array<{ label: string; value: string }>
    docs: SearchData[]
    filters: ReactNode
    resultsTitle: string
    emptyTitle: string
    emptyDescription: string
}

export function HubPage({
    eyebrow,
    title,
    description,
    stats,
    docs,
    filters,
    resultsTitle,
    emptyTitle,
    emptyDescription,
}: HubPageProps) {
    return (
        <MainContent className="docs-shell min-w-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="min-w-0 space-y-6">
                <HubHeader
                    eyebrow={eyebrow}
                    title={title}
                    description={description}
                    stats={stats}
                />
                {filters}
                <section
                    aria-labelledby="hub-results-title"
                    className="min-w-0 space-y-4"
                >
                    <h2
                        id="hub-results-title"
                        aria-live="polite"
                        aria-atomic="true"
                        className="break-words text-base font-semibold text-on-surface"
                    >
                        {resultsTitle}
                    </h2>
                    {docs.length > 0 ? (
                        <ul
                            data-testid="hub-results"
                            className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {docs.map((doc) => (
                                <li key={doc.href} className="min-w-0">
                                    <Link
                                        href={doc.href}
                                        className="group ds-card ds-focus-ring block h-full min-w-0 bg-surface-container-lowest p-3.5"
                                    >
                                        <MainCard doc={doc} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rounded-xl border border-outline-variant p-6">
                            <h3 className="text-lg font-semibold text-on-surface">
                                {emptyTitle}
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                                {emptyDescription}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </MainContent>
    )
}

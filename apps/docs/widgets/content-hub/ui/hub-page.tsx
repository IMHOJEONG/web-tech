import type { ReactNode } from 'react'
import { Link } from '~/shared/i18n/navigation'
import MainCard from '~/entities/document/ui/main-card'
import type { SearchData } from '~/lib/get-search-data'

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
        <main className="docs-shell min-w-0 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="min-w-0 space-y-6">
                <header className="space-y-3 border-b border-outline-variant pb-5">
                    <p className="text-xs font-semibold tracking-wide text-primary">
                        {eyebrow}
                    </p>
                    <h1 className="font-display break-words text-3xl font-bold leading-tight tracking-tight text-on-surface sm:text-4xl">
                        {title}
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                        {description}
                    </p>
                    <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="flex flex-wrap gap-2"
                            >
                                <dt>{stat.label}</dt>
                                <dd className="font-medium tabular-nums text-on-surface">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </header>
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
        </main>
    )
}

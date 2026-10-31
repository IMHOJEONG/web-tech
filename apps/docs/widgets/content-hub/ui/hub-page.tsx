import type { ReactNode } from 'react'
import { MainContent } from '~/shared/ui/main-content'
import { Link } from '~/shared/i18n/navigation'
import MainCard from '~/entities/document/ui/main-card'
import type { SearchData } from '~/lib/get-search-data'
import { HubHeader } from './hub-header'
import {
    journalPageLayout,
    journalListLayout,
} from '~/shared/ui/journal-layout'
import { useTranslations } from 'next-intl'

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
    const t = useTranslations('feedDiscovery')
    return (
        <MainContent className={journalPageLayout}>
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
                            className={journalListLayout}
                        >
                            {docs.map((doc) => (
                                <li key={doc.href} className="min-w-0">
                                    <Link
                                        href={doc.href}
                                        className="group ds-focus-ring block min-w-0 rounded-sm py-6"
                                    >
                                        <MainCard doc={doc} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="border-l-2 border-border px-5 py-3">
                            <h3 className="text-lg font-semibold text-on-surface">
                                {emptyTitle}
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm leading-7 text-on-surface-variant">
                                {emptyDescription}
                            </p>
                            <Link
                                href="/docs"
                                className="ds-focus-ring mt-4 inline-flex min-h-11 items-center rounded-sm text-sm text-[var(--docs-interactive-text)] underline underline-offset-4"
                            >
                                {t('browse')}
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </MainContent>
    )
}

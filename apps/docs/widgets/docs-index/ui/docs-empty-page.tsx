import { useTranslations } from 'next-intl'
import type { DocsSearchPageState } from '~/lib/docs-search-page-state'
import { formatSearchKeyword } from '~/feature/search/lib/format-search-keyword'
import { Link } from '~/shared/i18n/navigation'
import { MainContent } from '~/shared/ui/main-content'

type EmptyPageState = Extract<
    DocsSearchPageState,
    { mode: 'empty-all-docs' | 'empty-search' }
>

export function DocsEmptyPage({
    state,
    recommendations,
}: {
    state: EmptyPageState
    recommendations: readonly string[]
}) {
    const t = useTranslations('search.empty')
    const isSearch = state.mode === 'empty-search'

    return (
        <MainContent className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <section className="ds-panel min-w-0 space-y-5 p-5 sm:p-8">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                        {isSearch ? t('searchEyebrow') : t('allEyebrow')}
                    </p>
                    <h1 className="break-keep text-2xl font-extrabold tracking-tight text-on-surface [overflow-wrap:anywhere] sm:text-3xl">
                        {isSearch ? t('resultHeading') : t('allHeading')}
                    </h1>
                    {isSearch && (
                        <p className="break-keep text-base text-on-surface-variant [overflow-wrap:anywhere]">
                            {t('resultTitle', {
                                keyword: formatSearchKeyword(state.keyword),
                            })}
                        </p>
                    )}
                    <p className="text-sm leading-7 text-on-surface-variant">
                        {isSearch
                            ? t('resultDescription')
                            : t('allDescription')}
                    </p>
                </div>
                {isSearch && recommendations.length > 0 && (
                    <nav
                        aria-label={t('recommendations')}
                        className="flex flex-wrap gap-2"
                    >
                        {recommendations.map((term) => (
                            <Link
                                key={term}
                                href={`/docs?q=${encodeURIComponent(term)}`}
                                className="ds-focus-ring inline-flex min-h-11 max-w-full items-center rounded-full border border-border bg-surface-container px-3.5 py-2 text-sm text-on-surface-variant transition-colors hover:border-primary/50 hover:text-on-surface"
                            >
                                <span className="truncate">{term}</span>
                            </Link>
                        ))}
                    </nav>
                )}
                <Link
                    href={isSearch ? '/docs' : '/feed'}
                    className="ds-focus-ring inline-flex min-h-11 items-center rounded-full border border-border bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-(--docs-interactive-text) transition-colors hover:border-primary/50"
                >
                    {isSearch ? t('clear') : t('toFeed')}
                </Link>
            </section>
        </MainContent>
    )
}

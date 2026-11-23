'use client'

import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { KeyboardEventHandler, Ref } from 'react'
import { Link } from '~/shared/i18n/navigation'
import type { useSearchSuggestions } from '../model/use-search-suggestions'

type Props = {
    search: ReturnType<typeof useSearchSuggestions>
    listRef: Ref<HTMLUListElement>
    onListKeyDown: KeyboardEventHandler<HTMLUListElement>
    onNavigate: () => void
    onSuggestion: (keyword: string) => void
}

export function SearchSuggestionList({
    search,
    listRef,
    onListKeyDown,
    onNavigate,
    onSuggestion,
}: Props) {
    const t = useTranslations('search.drawer')
    if (search.status === 'loading' || search.status === 'idle')
        return (
            <div role="status" aria-label={t('loading')} className="space-y-3">
                <p className="text-sm text-on-surface-variant">
                    {t('loading')}
                </p>
                {[0, 1, 2].map((key) => (
                    <div
                        key={key}
                        aria-hidden="true"
                        className="h-24 animate-pulse rounded-xl bg-surface-container-low motion-reduce:animate-none"
                    />
                ))}
            </div>
        )
    if (search.status === 'error')
        return (
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                <p
                    role="status"
                    className="text-sm leading-6 text-on-surface-variant"
                >
                    {t('error')}
                </p>
                <button
                    type="button"
                    onClick={search.retry}
                    className="ds-focus-ring mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-(--docs-interactive-text)"
                >
                    {t('retry')}
                </button>
            </div>
        )
    const data = search.data!
    return (
        <div className="space-y-7">
            {data.suggestions.length > 0 && (
                <div>
                    <p className="mb-3 text-xs font-semibold text-on-surface-variant">
                        {t('suggestions')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {data.suggestions.map((term) => (
                            <button
                                type="button"
                                key={term}
                                onClick={() => onSuggestion(term)}
                                className="ds-focus-ring min-h-11 max-w-full break-words rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface hover:border-primary/40"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <section aria-label={t('results')}>
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-on-surface-variant">
                    <h3 className="font-semibold">
                        {search.query ? t('results') : t('recent')}
                    </h3>
                    <span role="status">
                        {t('count', { count: data.count })}
                    </span>
                </div>
                {data.results.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-outline-variant px-5 py-8 text-sm leading-6 text-on-surface-variant">
                        {t('empty')}
                    </p>
                ) : (
                    <ul
                        ref={listRef}
                        role="list"
                        onKeyDown={onListKeyDown}
                        className="space-y-2"
                    >
                        {data.results.map((result) => (
                            <li key={result.href}>
                                <Link
                                    href={result.href}
                                    prefetch={false}
                                    onNavigate={onNavigate}
                                    className="ds-focus-ring group flex min-w-0 gap-3 rounded-xl border border-outline-variant/70 p-4 transition-colors hover:border-primary/40 hover:bg-surface-container-low focus-visible:border-primary/70 focus-visible:bg-primary/10"
                                >
                                    <FileText
                                        aria-hidden="true"
                                        className="mt-1 size-4 shrink-0 text-on-surface-variant"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="mb-1 text-[0.6875rem] text-on-surface-variant">
                                            {result.section}
                                            {result.readMinutes
                                                ? ` · ${t('readMinutes', { count: result.readMinutes })}`
                                                : ''}
                                        </p>
                                        <p className="break-words text-sm font-semibold leading-6 text-on-surface [overflow-wrap:anywhere]">
                                            {result.title}
                                        </p>
                                        {result.summary && (
                                            <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-on-surface-variant [overflow-wrap:anywhere]">
                                                {result.summary}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

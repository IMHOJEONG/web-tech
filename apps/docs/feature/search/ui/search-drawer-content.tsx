'use client'

import {
    SheetClose,
    SheetDescription,
    SheetTitle,
} from '@web-tech/ui/components/sheet'
import { Search, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useState, type RefObject } from 'react'
import { getPathname, Link, useRouter } from '~/shared/i18n/navigation'
import { getSearchHref } from '~/shared/lib/search-query'
import type { SearchSuggestion } from '~/lib/search-suggestions'
import type { useSearchKeyword } from '../model/use-search-keyword'
import { useSearchNavigation } from '../model/use-search-navigation'
import { useSearchSuggestions } from '../model/use-search-suggestions'
import { SearchSubmitButton } from './search-submit-button'
import { SearchSuggestionList } from './search-suggestion-list'

type Props = {
    open: boolean
    input: ReturnType<typeof useSearchKeyword>
    inputRef: RefObject<HTMLInputElement | null>
    onNavigate: () => void
}

export function SearchDrawerContent({
    open,
    input,
    inputRef,
    onNavigate,
}: Props) {
    const t = useTranslations('search')
    const locale = useLocale()
    const router = useRouter()
    const listId = useId()
    const { isPending, handleSubmit } = useSearchNavigation(input)
    const search = useSearchSuggestions(
        input.keyword,
        open && !input.isComposing
    )
    const [selection, setSelection] = useState<{
        results: SearchSuggestion[]
        index: number
    } | null>(null)
    const results = search.data?.results
    const activeIndex =
        results && results === selection?.results ? selection.index : -1
    const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
    useEffect(() => {
        if (activeId)
            document
                .getElementById(activeId)
                ?.scrollIntoView({ block: 'nearest' })
    }, [activeId])
    return (
        <>
            <div className="shrink-0 border-b border-outline-variant px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-7">
                <div className="mb-1 flex items-center justify-between gap-4">
                    <SheetTitle className="font-display text-xl tracking-tight">
                        {t('drawer.title')}
                    </SheetTitle>
                    <SheetClose
                        aria-label={t('drawer.close')}
                        className="ds-focus-ring inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </SheetClose>
                </div>
                <SheetDescription className="text-sm leading-6 text-on-surface-variant">
                    {t('drawer.description')}
                </SheetDescription>
                <form
                    role="search"
                    aria-label={t('input.triggerLabel')}
                    aria-busy={isPending}
                    action={getPathname({ locale, href: '/docs' })}
                    method="get"
                    onSubmit={handleSubmit}
                    className="mt-5 flex min-h-14 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 focus-within:border-primary/60"
                >
                    <Search
                        aria-hidden="true"
                        className="size-4 shrink-0 text-on-surface-variant"
                    />
                    <input
                        ref={inputRef}
                        {...input.inputProps}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={Boolean(results?.length)}
                        aria-controls={results?.length ? listId : undefined}
                        aria-activedescendant={activeId}
                        aria-busy={search.status === 'loading'}
                        onKeyDown={(event) => {
                            input.inputProps.onKeyDown(event)
                            if (
                                event.defaultPrevented ||
                                input.composing.current ||
                                !results?.length
                            )
                                return
                            if (
                                event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp'
                            ) {
                                event.preventDefault()
                                const direction =
                                    event.key === 'ArrowDown' ? 1 : -1
                                const index =
                                    activeIndex < 0
                                        ? direction > 0
                                            ? 0
                                            : results.length - 1
                                        : (activeIndex +
                                              direction +
                                              results.length) %
                                          results.length
                                setSelection({ results, index })
                            } else if (
                                event.key === 'Enter' &&
                                activeIndex >= 0
                            ) {
                                event.preventDefault()
                                router.push(results[activeIndex]!.href)
                                onNavigate()
                            }
                        }}
                        type="text"
                        name="q"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={t('input.placeholder')}
                        aria-label={t('input.placeholder')}
                        className="ds-focus-ring h-11 min-w-0 flex-1 rounded-md border-0 bg-transparent px-1 text-base text-on-surface placeholder:text-on-surface-variant"
                    />
                    {input.keyword && (
                        <button
                            type="button"
                            aria-label={t('input.clearAriaLabel')}
                            className="ds-focus-ring flex size-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                            onClick={() => {
                                input.finishComposition('')
                                inputRef.current?.focus()
                            }}
                        >
                            <X aria-hidden="true" className="size-4" />
                        </button>
                    )}
                    <SearchSubmitButton
                        isPending={isPending}
                        label={t('input.submitAriaLabel')}
                        variant="icon"
                        className="size-11"
                    />
                </form>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
                <SearchSuggestionList
                    search={search}
                    listId={listId}
                    activeIndex={activeIndex}
                    onActiveChange={(index) => {
                        if (results) setSelection({ results, index })
                    }}
                    onNavigate={onNavigate}
                    onSuggestion={(term) => {
                        input.finishComposition(term)
                        inputRef.current?.focus()
                    }}
                />
            </div>
            <div className="shrink-0 border-t border-outline-variant bg-surface-container-low px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
                <Link
                    href={getSearchHref(input.keyword)}
                    prefetch={false}
                    onNavigate={onNavigate}
                    className="ds-focus-ring flex min-h-11 items-center justify-center rounded-lg bg-(--docs-interactive-text) px-4 py-2.5 text-sm font-semibold text-background hover:brightness-95"
                >
                    {t('drawer.viewAll')}
                </Link>
                <p className="mt-3 hidden text-center text-xs text-on-surface-variant sm:block">
                    {t('drawer.keyboardHint')}
                </p>
            </div>
        </>
    )
}

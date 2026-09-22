'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '~/shared/i18n/navigation'
import {
    FormEvent,
    KeyboardEvent,
    useEffect,
    useId,
    useRef,
    useState,
    useTransition,
} from 'react'
import { GoSearch } from 'react-icons/go'

const SEARCH_KEYWORD_MAX_LENGTH = 40

export const Search = () => {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentKeyword = searchParams.get('q') ?? ''
    const searchParamsString = searchParams.toString()

    return (
        <SearchForm
            key={currentKeyword}
            currentKeyword={currentKeyword}
            pathname={pathname}
            searchParamsString={searchParamsString}
        />
    )
}

function SearchForm({
    currentKeyword,
    pathname,
    searchParamsString,
}: {
    currentKeyword: string
    pathname: string
    searchParamsString: string
}) {
    const t = useTranslations('search')
    const router = useRouter()
    const formRef = useRef<HTMLFormElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelId = useId()
    const [keyword, setKeyword] = useState(currentKeyword)
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const frame = requestAnimationFrame(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (
                !(event.target instanceof Node) ||
                !formRef.current?.contains(event.target)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)

        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
        }
    }, [isOpen])

    const getTargetHref = (value: string) => {
        const trimmedKeyword = value.trim().slice(0, SEARCH_KEYWORD_MAX_LENGTH)

        if (!trimmedKeyword) {
            return '/docs'
        }

        const params = new URLSearchParams()
        params.set('q', trimmedKeyword)

        return `/docs?${params.toString()}`
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const targetHref = getTargetHref(keyword)
        const currentHref = searchParamsString
            ? `${pathname}?${searchParamsString}`
            : pathname

        if (targetHref === currentHref) {
            return
        }

        startTransition(() => {
            router.push(targetHref)
        })
    }

    const handleToggle = () => {
        setIsOpen((current) => !current)
    }

    const handleClear = () => {
        setKeyword('')
        inputRef.current?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
        if (event.key === 'Escape' && isOpen) {
            event.preventDefault()
            setIsOpen(false)
            triggerRef.current?.focus()
        }
    }

    return (
        <form
            ref={formRef}
            role="search"
            aria-label={t('input.triggerLabel')}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex items-center"
            aria-busy={isPending}
        >
            <button
                ref={triggerRef}
                type="button"
                className={cn(
                    'ds-focus-ring inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface lg:w-auto lg:px-3',
                    isOpen &&
                        'border-outline-variant bg-surface-container-low text-(--docs-interactive-text)'
                )}
                onClick={handleToggle}
                aria-label={t('input.triggerLabel')}
                aria-controls={panelId}
                aria-expanded={isOpen}
            >
                <GoSearch aria-hidden="true" className="size-4 shrink-0" />
                <span className="hidden text-sm font-medium lg:inline">
                    {t('input.triggerLabel')}
                </span>
            </button>

            <div
                id={panelId}
                className={cn(
                    'absolute inset-x-3 top-[calc(100%+0.5rem)] z-50 origin-top-right rounded-xl border border-outline-variant/70 bg-popover p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-[opacity,transform] duration-200 motion-reduce:transition-none dark:border-outline-variant dark:bg-surface-container-low dark:shadow-[0_24px_56px_rgba(0,0,0,0.42)] sm:left-auto sm:right-6 sm:w-80 md:right-8',
                    isOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0'
                )}
            >
                <div className="flex min-h-11 items-center gap-2 rounded-[0.875rem] border border-outline-variant/55 bg-background px-3.5 dark:border-outline-variant/80 dark:bg-surface">
                    <GoSearch
                        aria-hidden="true"
                        className="size-4 shrink-0 text-on-surface-variant"
                    />
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[0.95rem] leading-none text-on-surface placeholder:text-[0.95rem] placeholder:text-on-surface-variant"
                        value={keyword}
                        onChange={(event) =>
                            setKeyword(
                                event.target.value.slice(
                                    0,
                                    SEARCH_KEYWORD_MAX_LENGTH
                                )
                            )
                        }
                        maxLength={SEARCH_KEYWORD_MAX_LENGTH}
                        minLength={1}
                        placeholder={t('input.placeholder')}
                        aria-label={t('input.placeholder')}
                    />
                    {keyword ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="ds-focus-ring flex size-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface dark:hover:bg-surface-container-high"
                            aria-label={t('input.clearAriaLabel')}
                        >
                            <span aria-hidden="true" className="text-base">
                                ×
                            </span>
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="ds-focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-(--docs-interactive-text) transition-colors hover:bg-primary/15 disabled:bg-transparent disabled:text-outline"
                        aria-label={t('input.submitAriaLabel')}
                        disabled={isPending}
                    >
                        <GoSearch aria-hidden="true" className="size-4" />
                    </button>
                </div>
            </div>
        </form>
    )
}

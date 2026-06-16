'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    FormEvent,
    KeyboardEvent,
    useEffect,
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
    const [keyword, setKeyword] = useState(currentKeyword)
    const [isOpen, setIsOpen] = useState(Boolean(currentKeyword))
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (!isOpen) {
            return
        }

        requestAnimationFrame(() => {
            inputRef.current?.focus()
            inputRef.current?.select()
        })
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!formRef.current?.contains(event.target as Node)) {
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

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault()
            setIsOpen(false)
        }
    }

    return (
        <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative flex items-center"
            aria-busy={isPending}
        >
            <button
                type="button"
                className={cn(
                    'ds-focus-ring flex size-8 items-center justify-center rounded-md border border-transparent text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface',
                    isOpen &&
                        'border-outline-variant bg-surface-container-low text-primary'
                )}
                onClick={handleToggle}
                aria-label={t('input.submitAriaLabel')}
                aria-expanded={isOpen}
            >
                <GoSearch className="size-[1.1rem]" />
            </button>

            <div
                className={cn(
                    'absolute right-0 top-[calc(100%+0.625rem)] z-50 w-[min(20rem,calc(100vw-1rem))] origin-top-right rounded-xl border border-outline-variant/70 bg-popover p-1.5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-200 dark:border-outline-variant dark:bg-surface-container-low dark:shadow-[0_24px_56px_rgba(0,0,0,0.42)] sm:w-80',
                    isOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible -translate-y-1 opacity-0'
                )}
            >
                <div className="flex min-h-11 items-center gap-2 rounded-[0.875rem] border border-outline-variant/55 bg-background px-3.5 dark:border-outline-variant/80 dark:bg-surface">
                    <GoSearch className="size-4 shrink-0 text-outline dark:text-on-surface-variant" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="h-10 min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[0.95rem] leading-none text-on-surface outline-none placeholder:text-[0.95rem] placeholder:text-outline dark:placeholder:text-on-surface-variant"
                        value={keyword}
                        onChange={(event) =>
                            setKeyword(
                                event.target.value.slice(
                                    0,
                                    SEARCH_KEYWORD_MAX_LENGTH
                                )
                            )
                        }
                        onKeyDown={handleKeyDown}
                        maxLength={SEARCH_KEYWORD_MAX_LENGTH}
                        minLength={1}
                        placeholder={t('input.placeholder')}
                    />
                    {keyword ? (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="ds-focus-ring flex size-7 shrink-0 items-center justify-center rounded-full text-outline transition-colors hover:bg-surface-container-low hover:text-on-surface dark:text-on-surface-variant dark:hover:bg-surface-container-high"
                            aria-label={t('input.clearAriaLabel')}
                        >
                            <span aria-hidden="true" className="text-base">
                                ×
                            </span>
                        </button>
                    ) : null}
                    <button
                        type="submit"
                        className="ds-focus-ring flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/15 hover:text-secondary disabled:bg-transparent disabled:text-outline"
                        aria-label={t('input.submitAriaLabel')}
                        disabled={isPending}
                    >
                        <GoSearch className="size-4" />
                    </button>
                </div>
            </div>
        </form>
    )
}

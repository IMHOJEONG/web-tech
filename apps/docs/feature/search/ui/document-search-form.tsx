'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { useSearchKeyword } from '../model/use-search-keyword'
import { useSearchNavigation } from '../model/use-search-navigation'
import { SearchSubmitButton } from './search-submit-button'

type Props = {
    keyword?: string
    action: string
    label: string
    placeholder: string
    submitLabel: string
}

export function DocumentSearchForm({
    keyword,
    action,
    label,
    placeholder,
    submitLabel,
}: Props) {
    const t = useTranslations('search.input')
    const inputId = useId()
    const input = useSearchKeyword(keyword)
    const { isPending, handleSubmit } = useSearchNavigation(input)
    return (
        <form
            role="search"
            aria-label={label}
            action={action}
            method="get"
            onSubmit={handleSubmit}
            aria-busy={isPending}
            className="min-w-0 space-y-1.5"
        >
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-on-surface"
            >
                {t('queryLabel')}
            </label>
            <div className="flex min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-container-lowest p-1.5 focus-within:border-primary/60 focus-within:shadow-glow-primary">
                <input
                    {...input.inputProps}
                    id={inputId}
                    name="q"
                    type="search"
                    placeholder={placeholder}
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-on-surface placeholder:text-on-surface-variant"
                />
                <SearchSubmitButton
                    isPending={isPending}
                    label={submitLabel}
                    variant="text"
                />
            </div>
        </form>
    )
}

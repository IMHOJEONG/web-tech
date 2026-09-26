'use client'

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
            className="flex min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-container-lowest p-1.5 focus-within:border-primary/60 focus-within:shadow-glow-primary"
        >
            <input
                {...input.inputProps}
                name="q"
                type="search"
                placeholder={placeholder}
                aria-label={placeholder}
                className="min-h-11 min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant"
            />
            <SearchSubmitButton
                isPending={isPending}
                label={submitLabel}
                variant="text"
            />
        </form>
    )
}

'use client'

import { useSearchKeyword } from '../model/use-search-keyword'
import { normalizeSearchQuery } from '~/shared/lib/search-query'

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
    return (
        <form
            role="search"
            aria-label={label}
            action={action}
            onSubmit={(event) => {
                if (input.composing.current) {
                    event.preventDefault()
                    return
                }
                // Normalize the successful control before native GET navigation.
                const field = event.currentTarget.elements.namedItem(
                    'q'
                ) as HTMLInputElement
                field.value = normalizeSearchQuery(input.keyword)
            }}
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
            <button
                type="submit"
                data-touch-target="docs-index"
                className="ds-focus-ring min-h-11 shrink-0 rounded-xl bg-(--docs-interactive-text) px-4 py-2 text-sm font-semibold text-background transition hover:brightness-95"
            >
                {submitLabel}
            </button>
        </form>
    )
}

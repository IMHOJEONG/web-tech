'use client'

import { cn } from '@web-tech/ui/lib/utils'
import { LoaderCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GoSearch } from 'react-icons/go'

type Props = {
    isPending: boolean
    label: string
    variant: 'icon' | 'text'
}

export function SearchSubmitButton({ isPending, label, variant }: Props) {
    const t = useTranslations('search.input')
    return (
        <>
            <button
                type="submit"
                aria-label={isPending ? t('pendingLabel') : label}
                disabled={isPending}
                data-touch-target={
                    variant === 'text' ? 'docs-index' : undefined
                }
                className={cn(
                    'ds-focus-ring relative inline-flex shrink-0 items-center justify-center transition disabled:cursor-wait',
                    variant === 'icon'
                        ? 'size-8 rounded-full bg-primary/10 text-(--docs-interactive-text) hover:bg-primary/15'
                        : 'min-h-11 rounded-xl bg-(--docs-interactive-text) px-4 py-2 text-sm font-semibold text-background hover:brightness-95'
                )}
            >
                <span className={isPending ? 'invisible' : undefined}>
                    {variant === 'icon' ? (
                        <GoSearch aria-hidden="true" className="size-4" />
                    ) : (
                        label
                    )}
                </span>
                {isPending && (
                    <LoaderCircle
                        aria-hidden="true"
                        className="absolute size-4 animate-spin motion-reduce:animate-none"
                    />
                )}
            </button>
            <span role="status" className="sr-only">
                {isPending ? t('pendingLabel') : ''}
            </span>
        </>
    )
}

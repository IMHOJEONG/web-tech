'use client'

import { useTransition, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '~/shared/i18n/navigation'
import { getSearchHref, normalizeSearchQuery } from '~/shared/lib/search-query'
import type { useSearchKeyword } from './use-search-keyword'

export function useSearchNavigation(
    input: ReturnType<typeof useSearchKeyword>
) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (input.composing.current || isPending) return

        const query = normalizeSearchQuery(input.keyword)
        input.setKeyword(query)
        const targetHref = getSearchHref(query)
        const params = searchParams.toString()
        const currentHref = params ? `${pathname}?${params}` : pathname
        if (targetHref === currentHref) return

        startTransition(() => {
            router.push(targetHref)
        })
    }

    return { isPending, handleSubmit }
}

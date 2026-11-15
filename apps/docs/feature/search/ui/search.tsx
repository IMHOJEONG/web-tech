'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { usePathname } from '~/shared/i18n/navigation'
import { normalizeSearchQuery } from '~/shared/lib/search-query'
import { SearchDrawer } from './search-drawer'

export function Search() {
    const locale = useLocale()
    const pathname = usePathname()
    const keyword = normalizeSearchQuery(useSearchParams().get('q'))
    return (
        <SearchDrawer
            key={`${locale}:${pathname}:${keyword}`}
            initialKeyword={keyword}
        />
    )
}

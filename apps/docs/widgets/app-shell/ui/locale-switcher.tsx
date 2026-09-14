'use client'

import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Link, usePathname } from '~/shared/i18n/navigation'

export function LocaleSwitcher() {
    const locale = useLocale()
    const pathname = usePathname()
    const query = useSearchParams().toString()
    const target = locale === 'ko' ? 'en' : 'ko'
    return (
        <Link
            href={`${pathname}${query ? `?${query}` : ''}`}
            locale={target}
            aria-label={target === 'ko' ? '한국어로 보기' : 'View in English'}
            className="ds-focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-xs font-semibold text-on-surface-variant hover:text-primary"
        >
            {target === 'ko' ? 'KO' : 'EN'}
        </Link>
    )
}

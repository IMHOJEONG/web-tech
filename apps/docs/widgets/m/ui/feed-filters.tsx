import { cn } from '@web-tech/ui/lib/utils'
import { useTranslations } from 'next-intl'
import { Link } from '~/shared/i18n/navigation'
import { getFilterHref, type FeedFilter } from '../model/feed-document'

const FILTERS = [
    { key: 'all', label: 'ALL' },
    { key: 'web', label: 'WEB' },
    { key: 'mobile', label: 'MOBILE' },
    { key: 'uiux', label: 'UI/UX' },
] as const

export function FeedFilters({ activeFilter }: { activeFilter: FeedFilter }) {
    const t = useTranslations('feedRecent')
    return (
        <nav aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {FILTERS.map(({ key, label }) => (
                <Link
                    key={key}
                    href={getFilterHref(key)}
                    aria-current={activeFilter === key ? 'page' : undefined}
                    className={cn(
                        'ds-focus-ring inline-flex min-h-11 items-center border-b-2 px-2 py-2 font-mono text-xs transition-colors',
                        activeFilter === key
                            ? 'border-primary text-[var(--docs-interactive-text)]'
                            : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    )}
                >
                    {label}
                </Link>
            ))}
        </nav>
    )
}

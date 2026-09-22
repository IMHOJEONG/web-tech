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
                        'ds-outline-button ds-focus-ring min-h-11 px-4 py-2 text-sm',
                        activeFilter === key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'text-on-surface-variant hover:text-on-surface'
                    )}
                >
                    {label}
                </Link>
            ))}
        </nav>
    )
}

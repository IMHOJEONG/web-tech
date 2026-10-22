import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'

export async function DocsSearchRecommendations({
    terms,
}: {
    terms: readonly string[]
}) {
    const t = await getTranslations('docsIndex.discovery')
    if (!terms.length) return null
    return (
        <nav aria-label={t('recommendations')} className="space-y-3">
            <h2 className="text-sm font-semibold text-on-surface">
                {t('recommendations')}
            </h2>
            <div className="flex min-w-0 flex-wrap gap-2">
                {terms.map((term) => (
                    <Link
                        key={term}
                        href={`/docs?q=${encodeURIComponent(term)}`}
                        data-touch-target="docs-index"
                        className="ds-focus-ring inline-flex min-h-11 min-w-0 max-w-full items-center rounded-full border border-border bg-surface-container px-3.5 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary/50 hover:text-primary"
                    >
                        <span className="max-w-full truncate">{term}</span>
                    </Link>
                ))}
            </div>
        </nav>
    )
}

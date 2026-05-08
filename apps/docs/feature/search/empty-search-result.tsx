import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatSearchKeyword } from './lib/format-search-keyword'

interface EmptySearchResultProps {
    keyword: string
    recommendations: string[]
}

export const EmptySearchResult = ({
    keyword,
    recommendations,
}: EmptySearchResultProps) => {
    const t = useTranslations('search')
    const formattedKeyword = formatSearchKeyword(keyword)

    return (
        <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">
                {t('empty.resultTitle', {
                    keyword: formattedKeyword,
                })}
            </p>
            <p className="text-sm">{t('empty.resultDescription')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {recommendations.map((term) => (
                    <Link
                        key={term}
                        href={`/docs?q=${encodeURIComponent(term)}`}
                        className="ds-chip-muted px-3 py-1 text-xs font-medium normal-case tracking-normal hover:border-primary hover:text-primary"
                    >
                        {term}
                    </Link>
                ))}
            </div>
            <Link
                href="/docs"
                className="text-sm text-primary transition-colors hover:text-secondary"
            >
                {t('empty.clear')}
            </Link>
        </div>
    )
}

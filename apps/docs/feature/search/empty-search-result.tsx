import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface EmptySearchResultProps {
    keyword: string
    recommendations: string[]
}

export const EmptySearchResult = ({
    keyword,
    recommendations,
}: EmptySearchResultProps) => {
    const t = useTranslations('search')

    return (
        <div className="flex flex-col items-center gap-4 py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium">
                {t('empty.resultTitle', {
                    keyword: keyword,
                })}
            </p>
            <p className="text-sm">{t('empty.resultDescription')}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
                {recommendations.map((term) => (
                    <Link
                        key={term}
                        href={`/docs?q=${encodeURIComponent(term)}`}
                        className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-950"
                    >
                        {term}
                    </Link>
                ))}
            </div>
            <Link
                href="/docs"
                className="text-sm text-cyan-500 transition-colors hover:text-cyan-400"
            >
                {t('empty.clear')}
            </Link>
        </div>
    )
}

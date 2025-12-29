import { useTranslations } from 'next-intl'

interface EmptySearchResultProps {
    keyword: string
}

export const EmptySearchResult = ({ keyword }: EmptySearchResultProps) => {
    const t = useTranslations('search')

    return (
        <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
            <p className="text-lg font-medium">
                {t('empty.result-title', {
                    keyword: keyword,
                })}
            </p>
            <p className="text-sm">{t('empty.result-description')}</p>
        </div>
    )
}

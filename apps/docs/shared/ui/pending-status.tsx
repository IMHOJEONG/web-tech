import { useTranslations } from 'next-intl'

export function PendingStatus() {
    const t = useTranslations('common')
    return (
        <span role="status" className="sr-only">
            {t('loadingDocuments')}
        </span>
    )
}

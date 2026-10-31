import { useTranslations } from 'next-intl'
import type { OfflineFailure } from '../model/offline-error'

export function OfflineErrorDetails({ failure }: { failure: OfflineFailure }) {
    const t = useTranslations('offline')
    return (
        <details
            data-testid="offline-error-details"
            className="mt-2 text-xs text-on-surface-variant"
        >
            <summary className="ds-focus-ring w-fit cursor-pointer rounded-sm py-2">
                {t('errorDetails')}
            </summary>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 py-1">
                <dt>{t('errorCode')}</dt>
                <dd className="min-w-0 break-all">
                    <code>{failure.code}</code>
                </dd>
                <dt>{t('errorStage')}</dt>
                <dd className="min-w-0 break-all">
                    <code>{failure.stage}</code>
                </dd>
            </dl>
        </details>
    )
}

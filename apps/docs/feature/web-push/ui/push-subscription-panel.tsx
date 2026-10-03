'use client'

import { useTranslations } from 'next-intl'
import { useWebPush } from '../model/use-web-push'
import { PushAccessForm } from './push-access-form'

export function PushSubscriptionPanel() {
    const t = useTranslations('webPush')
    const { status, busy, subscribed, toggle, authorize, accessError } =
        useWebPush()
    const disabled =
        busy ||
        ['loading', 'denied', 'unsupported', 'unavailable'].includes(status)

    return (
        <section
            className="ds-panel space-y-3 p-5 sm:p-6"
            aria-labelledby="push-title"
        >
            <p className="text-xs font-semibold text-primary">
                {t('experiment')}
            </p>
            <h2
                id="push-title"
                className="font-display text-lg font-semibold text-on-surface"
            >
                {t('title')}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-on-surface-variant">
                {t('description')}
            </p>
            <p
                role="status"
                aria-live="polite"
                className="text-sm text-on-surface-variant"
            >
                {t(`status.${status}`)}
            </p>
            {status === 'locked' ? (
                <PushAccessForm
                    busy={busy}
                    error={accessError}
                    authorize={authorize}
                />
            ) : (
                <button
                    type="button"
                    className="ds-button-secondary ds-focus-ring min-h-11 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled}
                    onClick={() => void toggle()}
                >
                    {busy
                        ? t('busy')
                        : subscribed
                          ? t('unsubscribe')
                          : t('subscribe')}
                </button>
            )}
            <p className="text-xs leading-5 text-on-surface-variant">
                {t('deviceNote')}
            </p>
        </section>
    )
}

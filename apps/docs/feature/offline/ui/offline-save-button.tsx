'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { buildOfflineSnapshot } from '../model/offline-snapshot'
import {
    listenForOfflineArticleContext,
    sendOfflineMessage,
} from '../model/offline-client'
import {
    getOfflineFailure,
    getOfflineErrorMessageKey,
    OfflineOperationError,
    type OfflineFailure,
} from '../model/offline-error'
import { OfflineErrorDetails } from './offline-error-details'

const subscribe = () => () => {}
const capabilities = () =>
    window.isSecureContext && 'serviceWorker' in navigator && 'caches' in window
const serverCapabilities = () => false

export function OfflineSaveButton({
    path,
    title,
}: {
    path: string
    title: string
}) {
    const t = useTranslations('offline')
    const locale = useLocale() === 'en' ? 'en' : 'ko'
    const supported = useSyncExternalStore(
        subscribe,
        capabilities,
        serverCapabilities
    )
    const [saved, setSaved] = useState(false)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState('')
    const [failure, setFailure] = useState<OfflineFailure | null>(null)
    useEffect(() => {
        let active = true
        const stopContext = supported
            ? listenForOfflineArticleContext(path)
            : undefined
        if (supported)
            void sendOfflineMessage('list')
                .then((articles) => {
                    if (active)
                        setSaved(
                            articles.some((article) => article.path === path)
                        )
                })
                .catch(() => {})
        return () => {
            active = false
            stopContext?.()
        }
    }, [path, supported])
    async function save() {
        if (busy || !supported) return
        setBusy(true)
        setMessage('')
        setFailure(null)
        try {
            const root = document.querySelector<HTMLElement>(
                '[data-offline-content]'
            )
            if (!root) throw new OfflineOperationError('snapshot', 'snapshot')
            const snapshot = await buildOfflineSnapshot(root, {
                path,
                title,
                locale,
            })
            const articles = await sendOfflineMessage(
                'save',
                { snapshot },
                true
            )
            if (!articles.some((article) => article.path === path))
                throw new OfflineOperationError(
                    'confirmation',
                    'storage-confirmation'
                )
            setSaved(true)
            setMessage(
                snapshot.missingImages
                    ? t('partial', { count: snapshot.missingImages })
                    : t('saved')
            )
        } catch (error) {
            const problem = getOfflineFailure(error, 'snapshot')
            setFailure(problem)
            setMessage(
                t(
                    problem.stage === 'storage-confirmation'
                        ? 'responseError'
                        : getOfflineErrorMessageKey(problem.code)
                )
            )
        } finally {
            setBusy(false)
        }
    }
    return (
        <section
            className="mt-8 border-t border-outline-variant pt-4 text-sm"
            aria-label={t('label')}
        >
            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={save}
                    disabled={!supported || busy}
                    className="ds-focus-ring min-h-11 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 font-medium text-on-surface transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {busy ? t('saving') : saved ? t('update') : t('save')}
                </button>
                <a
                    href={`/offline.html?lang=${locale}`}
                    className="ds-focus-ring inline-flex min-h-11 items-center rounded-md underline underline-offset-4"
                >
                    {t('library')}
                </a>
            </div>
            <p className="mt-2 text-on-surface-variant">{t('notice')}</p>
            <p
                role="status"
                aria-live="polite"
                className="mt-1 text-on-surface-variant"
                data-offline-error-code={failure?.code}
                data-offline-error-stage={failure?.stage}
            >
                {message}
            </p>
            {failure && <OfflineErrorDetails failure={failure} />}
        </section>
    )
}

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface PushAccessFormProps {
    busy: boolean
    error: boolean
    authorize: (code: string) => Promise<void>
}

export function PushAccessForm({
    busy,
    error,
    authorize,
}: PushAccessFormProps) {
    const t = useTranslations('webPush.access')
    const [code, setCode] = useState('')

    return (
        <form
            className="max-w-xl space-y-3"
            onSubmit={(event) => {
                event.preventDefault()
                const supplied = code
                setCode('')
                void authorize(supplied)
            }}
        >
            <label
                htmlFor="push-invite"
                className="block text-sm text-on-surface"
            >
                {t('label')}
            </label>
            <input
                id="push-invite"
                type="password"
                className="ds-input ds-focus-ring min-h-11 w-full min-w-0"
                autoComplete="off"
                spellCheck={false}
                minLength={32}
                maxLength={128}
                required
                disabled={busy}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                aria-invalid={error}
                aria-describedby={
                    error ? 'push-access-error' : 'push-access-note'
                }
            />
            {error && (
                <p
                    id="push-access-error"
                    role="alert"
                    className="text-sm text-on-surface"
                >
                    {t('error')}
                </p>
            )}
            <button
                type="submit"
                disabled={busy}
                className="ds-button-secondary ds-focus-ring min-h-11 px-4 py-2 text-sm disabled:opacity-50"
            >
                {t(busy ? 'busy' : 'submit')}
            </button>
            <p
                id="push-access-note"
                className="text-xs leading-5 text-on-surface-variant"
            >
                {t('note')}
            </p>
        </form>
    )
}

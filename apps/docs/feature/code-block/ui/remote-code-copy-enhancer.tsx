'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { getCodeCopyLabels } from '../lib/code-copy-labels'

const REMOTE_CODE_COPY_BUTTON_ATTRIBUTE = 'data-remote-code-copy-button'
const COPIED_RESET_DELAY_MS = 1600

function createRemoteCodeCopyButton(code: string, locale: string) {
    const button = document.createElement('button')
    const labels = getCodeCopyLabels(locale)

    button.type = 'button'
    button.className = 'mdx-code-copy-button mdx-code-copy-button--remote'
    button.textContent = labels.idle.text
    button.setAttribute(REMOTE_CODE_COPY_BUTTON_ATTRIBUTE, 'true')
    button.setAttribute('aria-label', labels.idle.announcement)
    button.setAttribute('aria-live', 'polite')
    button.dataset.copyState = 'idle'

    let resetTimer: number | undefined

    const resetButton = () => {
        button.textContent = labels.idle.text
        button.setAttribute('aria-label', labels.idle.announcement)
        button.dataset.copyState = 'idle'
    }

    const handleClick = async () => {
        if (!code.trim()) {
            return
        }

        try {
            await navigator.clipboard.writeText(code)
            button.textContent = labels.copied.text
            button.setAttribute('aria-label', labels.copied.announcement)
            button.dataset.copyState = 'copied'
        } catch {
            button.textContent = labels.error.text
            button.setAttribute('aria-label', labels.error.announcement)
            button.dataset.copyState = 'error'
        }

        if (resetTimer) {
            window.clearTimeout(resetTimer)
        }

        resetTimer = window.setTimeout(resetButton, COPIED_RESET_DELAY_MS)
    }

    button.addEventListener('click', handleClick)

    return {
        button,
        cleanup: () => {
            if (resetTimer) {
                window.clearTimeout(resetTimer)
            }

            button.removeEventListener('click', handleClick)
            button.remove()
        },
    }
}

export function RemoteCodeCopyEnhancer() {
    const locale = useLocale()
    useEffect(() => {
        const cleanups: Array<() => void> = []
        const codeFrames = document.querySelectorAll<HTMLElement>(
            '.mdx-wrapper .mdx-code-frame'
        )

        codeFrames.forEach((codeFrame) => {
            if (codeFrame.querySelector('.mdx-code-copy-button')) {
                return
            }

            const codeElement = codeFrame.querySelector<HTMLElement>('pre code')
            // The full pre precedes the preview and may be inside closed details.
            const code = codeElement?.textContent ?? ''

            if (!code.trim()) {
                return
            }

            const { button, cleanup } = createRemoteCodeCopyButton(code, locale)

            codeFrame.appendChild(button)
            cleanups.push(cleanup)
        })

        return () => {
            cleanups.forEach((cleanup) => cleanup())
        }
    }, [locale])

    return null
}

'use client'

import { useEffect } from 'react'

const REMOTE_CODE_COPY_BUTTON_ATTRIBUTE = 'data-remote-code-copy-button'
const COPIED_RESET_DELAY_MS = 1600

function createRemoteCodeCopyButton(code: string) {
    const button = document.createElement('button')

    button.type = 'button'
    button.className = 'mdx-code-copy-button mdx-code-copy-button--remote'
    button.textContent = '복사'
    button.setAttribute(REMOTE_CODE_COPY_BUTTON_ATTRIBUTE, 'true')
    button.setAttribute('aria-label', '코드 복사')

    let resetTimer: number | undefined

    const resetButton = () => {
        button.textContent = '복사'
        button.setAttribute('aria-label', '코드 복사')
    }

    const handleClick = async () => {
        if (!code.trim()) {
            return
        }

        try {
            await navigator.clipboard.writeText(code)
            button.textContent = '복사됨'
            button.setAttribute('aria-label', '코드가 복사되었습니다')
        } catch {
            button.textContent = '복사 실패'
            button.setAttribute('aria-label', '코드 복사에 실패했습니다')
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
            const code = codeElement?.innerText ?? ''

            if (!code.trim()) {
                return
            }

            const { button, cleanup } = createRemoteCodeCopyButton(code)

            codeFrame.appendChild(button)
            cleanups.push(cleanup)
        })

        return () => {
            cleanups.forEach((cleanup) => cleanup())
        }
    }, [])

    return null
}

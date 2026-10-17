'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@web-tech/ui/lib/utils'
import { getCodeCopyLabels } from '../lib/code-copy-labels'

interface CodeCopyButtonProps {
    code: string
    className?: string
}

export function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
    const locale = useLocale()
    const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
    const label = getCodeCopyLabels(locale)[status]

    useEffect(() => {
        if (status === 'idle') {
            return
        }

        const timer = window.setTimeout(() => {
            setStatus('idle')
        }, 1600)

        return () => {
            window.clearTimeout(timer)
        }
    }, [status])

    const handleCopy = async () => {
        if (!code.trim()) {
            return
        }

        try {
            await navigator.clipboard.writeText(code)
            setStatus('copied')
        } catch {
            setStatus('error')
        }
    }

    return (
        <button
            type="button"
            className={cn('mdx-code-copy-button', className)}
            data-copy-state={status}
            onClick={handleCopy}
            aria-label={label.announcement}
        >
            {status === 'copied' ? (
                <Check className="size-3.5" aria-hidden="true" />
            ) : (
                <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span aria-live="polite">{label.text}</span>
        </button>
    )
}

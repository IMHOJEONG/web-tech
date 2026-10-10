'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@web-tech/ui/lib/utils'

interface CodeCopyButtonProps {
    code: string
    className?: string
}

export function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
    const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

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
            aria-label={
                status === 'copied'
                    ? '코드가 복사되었습니다'
                    : status === 'error'
                      ? '코드 복사에 실패했습니다'
                      : '코드 복사'
            }
        >
            {status === 'copied' ? (
                <Check className="size-3.5" aria-hidden="true" />
            ) : (
                <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span aria-live="polite">
                {status === 'copied'
                    ? '복사됨'
                    : status === 'error'
                      ? '복사 실패'
                      : '복사'}
            </span>
        </button>
    )
}

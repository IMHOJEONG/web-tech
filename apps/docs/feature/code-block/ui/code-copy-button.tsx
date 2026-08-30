'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@web-tech/ui/lib/utils'

interface CodeCopyButtonProps {
    code: string
    className?: string
}

export function CodeCopyButton({ code, className }: CodeCopyButtonProps) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) {
            return
        }

        const timer = window.setTimeout(() => {
            setCopied(false)
        }, 1600)

        return () => {
            window.clearTimeout(timer)
        }
    }, [copied])

    const handleCopy = async () => {
        if (!code.trim()) {
            return
        }

        await navigator.clipboard.writeText(code)
        setCopied(true)
    }

    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-display text-[0.68rem] tracking-[0.14em] text-white/72 uppercase transition hover:border-primary/40 hover:bg-primary/12 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                className
            )}
            onClick={handleCopy}
            aria-label={copied ? '코드가 복사되었습니다' : '코드 복사'}
        >
            {copied ? (
                <Check className="size-3.5" aria-hidden="true" />
            ) : (
                <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span>{copied ? '복사됨' : '복사'}</span>
        </button>
    )
}

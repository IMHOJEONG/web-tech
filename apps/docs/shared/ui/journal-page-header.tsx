import type { ReactNode } from 'react'
import { journalEyebrow } from './journal-layout'

type JournalPageHeaderProps = {
    eyebrow: string
    title: ReactNode
    description?: string
    children?: ReactNode
    trailing?: ReactNode
}

export function JournalPageHeader({
    eyebrow,
    title,
    description,
    children,
    trailing,
}: JournalPageHeaderProps) {
    return (
        <div className="min-w-0 space-y-4 border-b border-border pb-6">
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0 space-y-3">
                    <p className={journalEyebrow}>{eyebrow}</p>
                    <h1 className="font-display break-keep text-2xl font-bold leading-tight tracking-tight text-on-surface [overflow-wrap:anywhere] sm:text-4xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
                            {description}
                        </p>
                    )}
                </div>
                {trailing && <div className="min-w-0 lg:w-80">{trailing}</div>}
            </div>
            {children}
        </div>
    )
}

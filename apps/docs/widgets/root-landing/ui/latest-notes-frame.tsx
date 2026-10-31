import type { ReactNode } from 'react'
import { Link } from '~/shared/i18n/navigation'

export function LatestNotesFrame({
    title,
    viewAllLabel,
    children,
}: {
    title: string
    viewAllLabel: string
    children: ReactNode
}) {
    return (
        <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h2 className="font-display text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">
                    {title}
                </h2>
                <Link
                    href="/feed"
                    className="ds-focus-ring inline-flex min-h-11 items-center rounded-sm text-sm text-[var(--docs-interactive-text)] underline underline-offset-4"
                >
                    {viewAllLabel}
                </Link>
            </div>
            {children}
        </div>
    )
}

import type { ReactNode } from 'react'
import { Link } from '~/shared/i18n/navigation'

export function LatestNotesFrame({
    eyebrow,
    title,
    viewAllLabel,
    children,
}: {
    eyebrow: string
    title: string
    viewAllLabel: string
    children: ReactNode
}) {
    return (
        <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6 sm:py-16 md:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                        {eyebrow}
                    </p>
                    <h2 className="text-3xl font-semibold tracking-[-0.03em] text-on-surface sm:text-4xl">
                        {title}
                    </h2>
                </div>
                <Link
                    href="/feed"
                    className="text-sm font-medium tracking-[0.18em] text-on-surface-variant uppercase transition-colors hover:text-primary"
                >
                    {viewAllLabel}
                </Link>
            </div>
            <div className="ds-panel mt-8 overflow-hidden p-0">{children}</div>
        </div>
    )
}

import { cn } from '@web-tech/ui/lib/utils'
import Link from 'next/link'
import type { ReactNode } from 'react'

type DocsIndexControlPillProps = {
    active: boolean
    href: string
    children: ReactNode
}

export function DocsIndexControlPill({
    active,
    href,
    children,
}: DocsIndexControlPillProps) {
    return (
        <Link
            href={href}
            aria-current={active ? 'true' : undefined}
            data-touch-target="docs-index"
            className={cn(
                'ds-focus-ring inline-flex min-h-11 max-w-full items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition',
                active
                    ? 'border-primary bg-primary text-primary-foreground shadow-glow-primary'
                    : 'border-border bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary'
            )}
        >
            <span className="block max-w-full truncate">{children}</span>
        </Link>
    )
}

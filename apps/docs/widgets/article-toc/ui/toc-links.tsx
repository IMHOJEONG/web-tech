import type { MouseEvent } from 'react'
import type { TocItem } from 'remark-flexible-toc'
import { cn } from '@web-tech/ui/lib/utils'

type Props = {
    items: TocItem[]
    activeHref: string | null
    indented: boolean
    ordered: boolean
    tight: boolean
    onNavigate: (event: MouseEvent<HTMLAnchorElement>, href: string) => void
}

const indentation = ['ps-3', 'ps-6', 'ps-9', 'ps-12', 'ps-14', 'ps-16']

export function TocLinks({
    items,
    activeHref,
    indented,
    ordered,
    tight,
    onNavigate,
}: Props) {
    const baseDepth = Math.min(...items.map((item) => item.depth))

    return (
        <ul className="m-0 max-h-[min(55dvh,32rem)] min-w-0 list-none overflow-y-auto overscroll-contain border-s border-outline-variant/70 py-1 [scrollbar-width:thin]">
            {items.map((heading) => {
                const active = heading.href === activeHref
                const level = indented ? heading.depth - baseDepth : 0
                return (
                    <li key={heading.href} className="m-0 min-w-0 p-0">
                        <a
                            href={heading.href}
                            aria-current={active ? 'location' : undefined}
                            data-toc-depth={heading.depth}
                            onClick={(event) => onNavigate(event, heading.href)}
                            className={cn(
                                'ds-focus-ring relative -ms-px flex min-h-11 items-start gap-2 border-s-2 border-transparent pe-2 font-body text-[0.8125rem] leading-6 text-on-surface-variant no-underline transition-colors duration-150 hover:bg-surface-container-low hover:text-on-surface motion-reduce:transition-none motion-reduce:duration-0 lg:min-h-9',
                                indentation[level],
                                tight ? 'py-0.5' : 'py-1.5',
                                active &&
                                    'border-primary bg-primary/5 font-semibold text-[var(--docs-interactive-text)]'
                            )}
                        >
                            {ordered && (
                                <span className="shrink-0 font-mono text-xs tabular-nums text-outline">
                                    {heading.numbering.slice(1).join('.')}.
                                </span>
                            )}
                            <span className="min-w-0 [overflow-wrap:anywhere]">
                                {heading.value}
                            </span>
                        </a>
                    </li>
                )
            })}
        </ul>
    )
}

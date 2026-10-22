import type { ReactNode } from 'react'

export type HubHeaderProps = {
    eyebrow: string
    title: string
    description: string
    stats: Array<{ label: string; value: ReactNode }>
}

export function HubHeader({
    eyebrow,
    title,
    description,
    stats,
}: HubHeaderProps) {
    return (
        <header
            data-hub-header
            className="space-y-3 border-b border-outline-variant pb-5"
        >
            <p className="text-xs font-semibold tracking-wide text-primary">
                {eyebrow}
            </p>
            <h1 className="font-display break-words text-3xl font-bold leading-tight tracking-tight text-on-surface sm:text-4xl">
                {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
                {description}
            </p>
            <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-on-surface-variant">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex flex-wrap gap-2">
                        <dt>{stat.label}</dt>
                        <dd className="font-medium tabular-nums text-on-surface">
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </header>
    )
}

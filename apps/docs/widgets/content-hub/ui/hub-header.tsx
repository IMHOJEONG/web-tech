import type { ReactNode } from 'react'
import { JournalPageHeader } from '~/shared/ui/journal-page-header'

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
        <header data-hub-header>
            <JournalPageHeader
                eyebrow={eyebrow}
                title={title}
                description={description}
            >
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
            </JournalPageHeader>
        </header>
    )
}

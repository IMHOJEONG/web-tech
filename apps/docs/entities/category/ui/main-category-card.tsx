import type { ComponentType } from 'react'

interface MainCategoryCardProps {
    title: string
    summary: string
    icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

export const MainCategoryCard = ({
    title,
    summary,
    icon: Icon,
}: MainCategoryCardProps) => {
    return (
        <div className="flex size-full flex-col gap-4">
            <div className="ds-panel-muted flex aspect-[16/8] w-full items-end overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_48%),linear-gradient(145deg,var(--surface-container-lowest),var(--surface-container-low))] p-5">
                <div className="flex size-14 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest text-primary shadow-sm">
                    <Icon aria-hidden className="size-7" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="text-xl font-semibold tracking-tight text-on-surface">
                    {title}
                </div>
                <div className="text-sm leading-6 text-on-surface-variant">
                    {summary}
                </div>
            </div>
        </div>
    )
}

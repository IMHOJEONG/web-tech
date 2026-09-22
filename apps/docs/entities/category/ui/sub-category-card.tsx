import type { ComponentType } from 'react'

interface SubCategoryCardProps {
    title: string
    summary: string
    icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

export const SubCategoryCard = ({
    title,
    summary,
    icon: Icon,
}: SubCategoryCardProps) => {
    return (
        <div className="flex size-full flex-col gap-4 p-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-container-low text-primary">
                <Icon aria-hidden className="size-6" />
            </div>
            <div className="space-y-2">
                <div className="font-display text-lg font-semibold text-on-surface">
                    {title}
                </div>
                <div className="text-sm leading-6 text-on-surface-variant">
                    {summary}
                </div>
            </div>
        </div>
    )
}

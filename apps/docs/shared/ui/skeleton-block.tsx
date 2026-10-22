import { cn } from '@web-tech/ui/lib/utils'

export function SkeletonBlock({ className }: { className?: string }) {
    return (
        <div
            aria-hidden="true"
            className={cn('rounded bg-surface-container-low', className)}
        />
    )
}

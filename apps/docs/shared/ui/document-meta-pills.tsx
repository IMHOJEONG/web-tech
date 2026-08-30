import { cn } from '@web-tech/ui/lib/utils'

type DocumentMetaPill = {
    key: string
    label: string
    tone?: 'default' | 'tag'
}

type DocumentMetaPillsProps = {
    className?: string
    items: DocumentMetaPill[]
}

function getPillClassName(tone: DocumentMetaPill['tone']) {
    if (tone === 'tag') {
        return 'border-transparent bg-transparent px-1.5'
    }

    return 'border-border bg-surface-container-low px-2.5'
}

export function DocumentMetaPills({
    className,
    items,
}: DocumentMetaPillsProps) {
    if (items.length === 0) {
        return null
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-1.5 text-xs text-outline',
                className
            )}
        >
            {items.map((item) => (
                <span
                    key={item.key}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border py-1 font-medium text-outline',
                        getPillClassName(item.tone)
                    )}
                >
                    {item.label}
                </span>
            ))}
        </div>
    )
}

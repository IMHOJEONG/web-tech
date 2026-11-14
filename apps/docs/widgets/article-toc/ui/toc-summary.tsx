import { ChevronDown, List } from 'lucide-react'

type Props = {
    title: string
    count: number
    currentTitle?: string
    onToggle: () => void
}

export function TocSummary({ title, count, currentTitle, onToggle }: Props) {
    return (
        <summary
            className="ds-focus-ring flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-md py-2 text-on-surface [&::-webkit-details-marker]:hidden"
            onClick={(event) => {
                event.preventDefault()
                onToggle()
            }}
        >
            <List aria-hidden="true" className="size-4 shrink-0 text-outline" />
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-display text-sm font-semibold">
                    {title}
                    <span
                        aria-hidden="true"
                        className="font-mono text-[0.6875rem] font-normal tabular-nums text-outline"
                    >
                        {String(count).padStart(2, '0')}
                    </span>
                </span>
                {currentTitle && (
                    <span
                        aria-hidden="true"
                        className="mt-0.5 block truncate font-body text-xs font-normal leading-5 text-on-surface-variant group-open:hidden"
                    >
                        {currentTitle}
                    </span>
                )}
            </span>
            <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-outline transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none motion-reduce:duration-0"
            />
        </summary>
    )
}

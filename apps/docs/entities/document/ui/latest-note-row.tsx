import { getTime } from '@web-tech/ui/lib/time'
import Link from 'next/link'

export type LatestNoteRowItem = {
    href: string
    title: string
    summary: string
    date?: string
    sectionLabel: string
}

type LatestNoteRowProps = {
    item: LatestNoteRowItem
    openLabel: string
}

export function LatestNoteRow({ item, openLabel }: LatestNoteRowProps) {
    return (
        <Link
            href={item.href}
            className="group flex flex-col gap-4 border-t border-outline-variant/70 px-4 py-5 transition-colors hover:bg-surface-container-low/60 sm:flex-row sm:items-center sm:gap-6"
        >
            <div className="w-full max-w-36 shrink-0 space-y-1">
                <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                    {item.sectionLabel}
                </p>
                {item.date ? (
                    <p className="text-sm text-on-surface-variant">
                        {getTime(item.date)}
                    </p>
                ) : null}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-on-surface transition-colors group-hover:text-primary sm:text-xl">
                    {item.title}
                </h3>
                <p className="line-clamp-2 text-sm leading-6 text-on-surface-variant sm:text-base">
                    {item.summary}
                </p>
            </div>

            <div className="shrink-0 text-xs font-semibold tracking-[0.18em] text-outline uppercase transition-colors group-hover:text-primary">
                {openLabel}
            </div>
        </Link>
    )
}

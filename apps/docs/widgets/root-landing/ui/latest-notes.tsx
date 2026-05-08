import Link from 'next/link'
import {
    LatestNoteRow,
    type LatestNoteRowItem,
} from '~/entities/document/ui/latest-note-row'

type LatestNotesProps = {
    eyebrow: string
    title: string
    viewAllLabel: string
    openLabel: string
    items: LatestNoteRowItem[]
    unavailableTitle?: string
    unavailableDescription?: string
}

export function LatestNotes({
    eyebrow,
    title,
    viewAllLabel,
    openLabel,
    items,
    unavailableTitle,
    unavailableDescription,
}: LatestNotesProps) {
    return (
        <section>
            <div className="mx-auto w-full max-w-page px-4 py-12 sm:px-6 sm:py-16 md:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold tracking-[0.2em] text-outline uppercase">
                            {eyebrow}
                        </p>
                        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-on-surface sm:text-4xl">
                            {title}
                        </h2>
                    </div>
                    <Link
                        href="/feed"
                        className="text-sm font-medium tracking-[0.18em] text-on-surface-variant uppercase transition-colors hover:text-primary"
                    >
                        {viewAllLabel}
                    </Link>
                </div>

                <div className="ds-panel mt-8 overflow-hidden p-0">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <LatestNoteRow
                                key={item.id}
                                item={item}
                                openLabel={openLabel}
                            />
                        ))
                    ) : (
                        <div className="space-y-3 px-5 py-6 sm:px-6 sm:py-7">
                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-on-surface">
                                {unavailableTitle}
                            </h3>
                            <p className="max-w-2xl break-keep text-sm leading-6 text-on-surface-variant sm:text-base">
                                {unavailableDescription}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

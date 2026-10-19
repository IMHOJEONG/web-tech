import { LatestNotesFrame } from './latest-notes-frame'
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
            <LatestNotesFrame
                eyebrow={eyebrow}
                title={title}
                viewAllLabel={viewAllLabel}
            >
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
            </LatestNotesFrame>
        </section>
    )
}

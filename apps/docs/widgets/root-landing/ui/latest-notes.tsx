import { LatestNotesFrame } from './latest-notes-frame'
import {
    LatestNoteRow,
    type LatestNoteRowItem,
} from '~/entities/document/ui/latest-note-row'
import { journalListLayout } from '~/shared/ui/journal-layout'

type LatestNotesProps = {
    title: string
    viewAllLabel: string
    items: LatestNoteRowItem[]
    unavailableTitle?: string
    unavailableDescription?: string
}

export function LatestNotes({
    title,
    viewAllLabel,
    items,
    unavailableTitle,
    unavailableDescription,
}: LatestNotesProps) {
    return (
        <section data-testid="landing-latest-notes">
            <LatestNotesFrame title={title} viewAllLabel={viewAllLabel}>
                {items.length > 0 ? (
                    <ul className={journalListLayout}>
                        {items.map((item) => (
                            <li key={item.id} className="min-w-0">
                                <LatestNoteRow item={item} />
                            </li>
                        ))}
                    </ul>
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

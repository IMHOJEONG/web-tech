import { getTranslations } from 'next-intl/server'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import { LatestNotesFrame } from './latest-notes-frame'
import { journalListLayout } from '~/shared/ui/journal-layout'
import { documentPreviewLayout } from '~/entities/document/ui/document-preview-layout'

export async function LatestNotesPending() {
    const t = await getTranslations('rootLanding')
    return (
        <section aria-busy="true" data-page-pending="landing-notes">
            <PendingStatus />
            <LatestNotesFrame
                title={t('latestNotes.title')}
                viewAllLabel={t('latestNotes.viewAll')}
            >
                <div
                    aria-hidden="true"
                    className={`${journalListLayout} motion-safe:animate-pulse`}
                >
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={documentPreviewLayout}>
                            <div className="min-w-0 space-y-3">
                                <SkeletonBlock className="h-4 w-36" />
                                <SkeletonBlock className="h-7 w-3/4" />
                                <SkeletonBlock className="h-12 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </LatestNotesFrame>
        </section>
    )
}

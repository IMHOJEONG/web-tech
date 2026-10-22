import { getTranslations } from 'next-intl/server'
import { PendingStatus } from '~/shared/ui/pending-status'
import { SkeletonBlock } from '~/shared/ui/skeleton-block'
import { LatestNotesFrame } from './latest-notes-frame'

export async function LatestNotesPending() {
    const t = await getTranslations('rootLanding')
    return (
        <section aria-busy="true" data-page-pending="landing-notes">
            <PendingStatus />
            <LatestNotesFrame
                eyebrow={t('latestNotes.eyebrow')}
                title={t('latestNotes.title')}
                viewAllLabel={t('latestNotes.viewAll')}
            >
                <div aria-hidden="true" className="motion-safe:animate-pulse">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-4 border-t border-outline-variant/70 px-4 py-5 sm:flex-row sm:items-center sm:gap-6"
                        >
                            <div className="w-full max-w-36 shrink-0 space-y-1">
                                <SkeletonBlock className="h-4 w-24" />
                                <SkeletonBlock className="h-5 w-28" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                                <SkeletonBlock className="h-7 w-3/4" />
                                <SkeletonBlock className="h-12 w-full" />
                            </div>
                            <SkeletonBlock className="h-4 w-20 shrink-0" />
                        </div>
                    ))}
                </div>
            </LatestNotesFrame>
        </section>
    )
}

import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { DocumentPreviewSkeleton } from '~/entities/document/ui/document-preview-skeleton'
import { UiUxHubHero } from './uiux-hub-hero'
import {
    journalPageLayout,
    journalListLayout,
} from '~/shared/ui/journal-layout'

export async function UiUxHubPending() {
    const t = await getTranslations('uiuxHub')
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending="ui-ux"
            className={journalPageLayout}
        >
            <PendingStatus />
            <div className="space-y-6">
                <UiUxHubHero
                    eyebrow={t('hero.eyebrow')}
                    titleLineOne={t('hero.titleLineOne')}
                    titleLineTwo={t('hero.titleLineTwo')}
                    description={t('hero.description')}
                />
                <div
                    className={`${journalListLayout} motion-safe:animate-pulse`}
                >
                    <DocumentPreviewSkeleton />
                    <DocumentPreviewSkeleton />
                </div>
            </div>
        </MainContent>
    )
}

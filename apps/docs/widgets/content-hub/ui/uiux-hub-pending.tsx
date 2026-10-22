import { getTranslations } from 'next-intl/server'
import { MainContent } from '~/shared/ui/main-content'
import { PendingStatus } from '~/shared/ui/pending-status'
import { DocumentPreviewSkeleton } from '~/entities/document/ui/document-preview-skeleton'
import { UiUxHubHero } from './uiux-hub-hero'

export async function UiUxHubPending() {
    const t = await getTranslations('uiuxHub')
    return (
        <MainContent
            aria-busy="true"
            data-testid="content-pending"
            data-page-pending="ui-ux"
            className="docs-shell overflow-x-clip px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
        >
            <PendingStatus />
            <div className="space-y-10 lg:space-y-14">
                <UiUxHubHero
                    eyebrow={t('hero.eyebrow')}
                    titleLineOne={t('hero.titleLineOne')}
                    titleLineTwo={t('hero.titleLineTwo')}
                    description={t('hero.description')}
                />
                <div className="grid min-w-0 gap-4 motion-safe:animate-pulse">
                    <DocumentPreviewSkeleton />
                    <DocumentPreviewSkeleton />
                </div>
            </div>
        </MainContent>
    )
}

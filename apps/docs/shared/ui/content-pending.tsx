import { getTranslations } from 'next-intl/server'
import { MainContent } from './main-content'

export async function ContentPending() {
    const t = await getTranslations('common')
    return (
        <MainContent
            className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
            aria-busy="true"
            data-testid="content-pending"
        >
            <p role="status" className="mb-6 text-sm text-on-surface-variant">
                {t('loadingDocuments')}
            </p>
            <div className="space-y-4" aria-hidden="true">
                {[0, 1, 2].map((row) => (
                    <div
                        key={row}
                        className="ds-panel space-y-3 p-6 motion-safe:animate-pulse"
                    >
                        <div className="h-5 w-2/3 rounded bg-surface-container-low" />
                        <div className="h-4 w-full rounded bg-surface-container-low" />
                        <div className="h-4 w-1/3 rounded bg-surface-container-low" />
                    </div>
                ))}
            </div>
        </MainContent>
    )
}

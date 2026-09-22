import { getTranslations } from 'next-intl/server'

export async function ContentPending() {
    const t = await getTranslations('common')
    return (
        <div
            className="docs-shell px-4 py-10 sm:px-6 sm:py-12 lg:px-8"
            role="status"
            aria-busy="true"
            data-testid="content-pending"
        >
            <p className="mb-6 text-sm text-on-surface-variant">
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
        </div>
    )
}

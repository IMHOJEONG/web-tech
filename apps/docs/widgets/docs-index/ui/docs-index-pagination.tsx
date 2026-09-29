import { getTranslations } from 'next-intl/server'
import { Link } from '~/shared/i18n/navigation'
import { cn } from '@web-tech/ui/lib/utils'
import {
    getDocsIndexHref,
    type DocsIndexControls,
} from '../model/docs-index-controls'
import type { getPaginationRange } from '../model/docs-index-pagination'
import { DocsPageNavigationLink } from './docs-page-navigation-link'

function getDocsPageHref(page: number, controls: DocsIndexControls) {
    return getDocsIndexHref({ controls, page })
}

export async function DocsIndexPagination({
    pagination,
    controls,
}: {
    pagination: ReturnType<typeof getPaginationRange>
    controls: DocsIndexControls
}) {
    const t = await getTranslations('docsIndex')
    if (pagination.totalPages <= 1) return null
    return (
        <nav
            aria-label={t('allDocuments.paginationAriaLabel')}
            className="motion-layout flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
        >
            <DocsPageNavigationLink
                href={
                    pagination.page > 1
                        ? getDocsPageHref(pagination.page - 1, controls)
                        : undefined
                }
                label={t('allDocuments.previous')}
            />
            <div className="flex flex-wrap items-center gap-1.5">
                {Array.from(
                    { length: pagination.totalPages },
                    (_, index) => index + 1
                ).map((page) => (
                    <Link
                        key={page}
                        href={getDocsPageHref(page, controls)}
                        aria-current={
                            page === pagination.page ? 'page' : undefined
                        }
                        data-touch-target="docs-index"
                        className={cn(
                            'ds-focus-ring inline-flex size-11 items-center justify-center rounded-full border text-sm font-semibold transition',
                            page === pagination.page
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary'
                        )}
                    >
                        {page}
                    </Link>
                ))}
            </div>
            <DocsPageNavigationLink
                href={
                    pagination.page < pagination.totalPages
                        ? getDocsPageHref(pagination.page + 1, controls)
                        : undefined
                }
                label={t('allDocuments.next')}
            />
        </nav>
    )
}

import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import {
    getDocsIndexHref,
    type DocsIndexControls,
} from '~/widgets/docs-index/model/docs-index-controls'

type DocsIndexEmptyStateProps = {
    controls: DocsIndexControls
    keyword?: string
}

export async function DocsIndexEmptyState({
    controls,
    keyword,
}: DocsIndexEmptyStateProps) {
    const t = await getTranslations('docsIndex')

    return (
        <div className="rounded-3xl border border-dashed border-border bg-surface-container-lowest px-5 py-8 text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-outline uppercase">
                {t('emptyFiltered.eyebrow')}
            </p>
            <h3 className="mt-3 text-xl font-bold tracking-tight text-on-surface">
                {t('emptyFiltered.title')}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant">
                {t('emptyFiltered.description')}
            </p>
            <Link
                href={getDocsIndexHref({
                    controls,
                    keyword,
                    overrides: {
                        section: 'all',
                        source: 'all',
                        sort: 'latest',
                    },
                })}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-fixed"
            >
                {t('emptyFiltered.reset')}
            </Link>
        </div>
    )
}

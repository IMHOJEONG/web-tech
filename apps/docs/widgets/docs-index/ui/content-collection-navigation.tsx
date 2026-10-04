import { getLocale, getTranslations } from 'next-intl/server'
import type { SearchData } from '~/lib/get-search-data'
import { Link } from '~/shared/i18n/navigation'
import { getContentCollections } from '../model/content-collections'
import {
    getDocsIndexHref,
    type DocsIndexControls,
} from '../model/docs-index-controls'
import { DocsIndexControlPill } from './docs-index-control-pill'

export async function ContentCollectionNavigation({
    docs,
    controls,
    keyword,
}: {
    docs: SearchData[]
    controls: DocsIndexControls
    keyword?: string
}) {
    const collections = getContentCollections(docs)
    const t = await getTranslations('docsIndex.discovery')
    const locale = (await getLocale()) === 'ko' ? 'ko' : 'en'
    const selected = collections.find(({ id }) => id === controls.collection)
    if (!collections.length && !controls.collection) return null
    return (
        <section
            data-testid="content-collections"
            className="min-w-0 space-y-3 rounded-2xl border border-border p-4"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-on-surface">
                    {t('title')}
                </h2>
                {controls.collection && (
                    <DocsIndexControlPill
                        active={false}
                        href={getDocsIndexHref({
                            controls,
                            keyword,
                            overrides: { collection: '' },
                        })}
                    >
                        {t('clearCollection')}
                    </DocsIndexControlPill>
                )}
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
                {collections.map((collection) => (
                    <DocsIndexControlPill
                        key={collection.id}
                        active={controls.collection === collection.id}
                        href={getDocsIndexHref({
                            controls,
                            keyword,
                            overrides: { collection: collection.id },
                        })}
                    >
                        {t(collection.kind)} · {collection.title[locale]}
                    </DocsIndexControlPill>
                ))}
            </div>
            {selected && (
                <div className="space-y-3 border-t border-border pt-3">
                    <p className="text-sm leading-6 text-on-surface-variant">
                        {selected.description[locale]}
                    </p>
                    <p className="text-xs text-outline">{t('sequenceHint')}</p>
                    <ol className="grid min-w-0 gap-1">
                        {selected.docs.map((doc, index) => (
                            <li key={doc.href}>
                                <Link
                                    href={doc.href}
                                    className="ds-focus-ring flex min-h-11 min-w-0 gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-container"
                                >
                                    <span
                                        aria-hidden
                                        className="font-mono text-primary"
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="min-w-0 break-words text-on-surface">
                                        {doc.title ?? doc.slug}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </section>
    )
}

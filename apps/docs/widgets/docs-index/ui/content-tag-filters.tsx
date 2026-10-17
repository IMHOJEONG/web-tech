import { getTranslations } from 'next-intl/server'
import type { SearchData } from '~/lib/get-search-data'
import { getContentTags } from '../model/content-collections'
import {
    getDocsIndexHref,
    type DocsIndexControls,
} from '../model/docs-index-controls'
import { DocsIndexControlPill } from './docs-index-control-pill'

export async function ContentTagFilters({
    docs,
    controls,
    keyword,
}: {
    docs: SearchData[]
    controls: DocsIndexControls
    keyword?: string
}) {
    const tags = getContentTags(docs)
    const t = await getTranslations('docsIndex.discovery')
    if (!tags.length && !controls.tag) return null
    const selectedIsMissing =
        controls.tag && !tags.some(({ tag }) => tag === controls.tag)
    const renderTags = (items: typeof tags) =>
        items.map(({ tag, count }) => (
            <DocsIndexControlPill
                key={tag}
                active={controls.tag === tag}
                href={getDocsIndexHref({
                    controls,
                    keyword,
                    overrides: { tag },
                })}
            >
                #{tag}{' '}
                <span className="ml-1.5 text-xs opacity-70">{count}</span>
            </DocsIndexControlPill>
        ))
    return (
        <nav
            aria-label={t('tags')}
            data-testid="content-tag-filters"
            className="space-y-2"
        >
            <h3 className="text-sm font-semibold text-on-surface">
                {t('tags')}
            </h3>
            <div className="flex min-w-0 flex-wrap gap-2">
                <DocsIndexControlPill
                    active={!controls.tag}
                    href={getDocsIndexHref({
                        controls,
                        keyword,
                        overrides: { tag: '' },
                    })}
                >
                    {t('allTags')}
                </DocsIndexControlPill>
                {renderTags(
                    tags.filter(
                        ({ tag }, index) => index < 8 || tag === controls.tag
                    )
                )}
                {selectedIsMissing && (
                    <DocsIndexControlPill
                        active
                        href={getDocsIndexHref({
                            controls,
                            keyword,
                            overrides: { tag: '' },
                        })}
                    >
                        #{controls.tag} · {t('clear')}
                    </DocsIndexControlPill>
                )}
            </div>
            {tags.length > 8 && (
                <details>
                    <summary className="ds-focus-ring w-fit cursor-pointer rounded-md py-3 text-sm text-on-surface-variant">
                        {t('moreTags')}
                    </summary>
                    <div className="flex min-w-0 flex-wrap gap-2">
                        {renderTags(
                            tags.filter(
                                ({ tag }, index) =>
                                    index >= 8 && tag !== controls.tag
                            )
                        )}
                    </div>
                </details>
            )}
        </nav>
    )
}

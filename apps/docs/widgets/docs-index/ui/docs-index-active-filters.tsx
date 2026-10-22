import { useLocale, useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { Link } from '~/shared/i18n/navigation'
import { CONTENT_COLLECTIONS } from '../model/content-collections'
import {
    DOCS_INDEX_SECTION_FILTERS,
    getDocsIndexHref,
    type DocsIndexControls,
} from '../model/docs-index-controls'

export function DocsIndexActiveFilters({
    controls,
    keyword,
}: {
    controls: DocsIndexControls
    keyword?: string
}) {
    const t = useTranslations('docsIndex.filters')
    const locale = useLocale() === 'ko' ? 'ko' : 'en'
    const section = DOCS_INDEX_SECTION_FILTERS.find(
        ({ value }) => value === controls.section
    )
    const collection = controls.collection
        ? CONTENT_COLLECTIONS.find(({ id }) => id === controls.collection)
        : undefined
    const selections = [
        ...(controls.section !== 'all' && section
            ? [
                  {
                      key: 'section',
                      label: t(`sections.${section.messageKey}`),
                      overrides: { section: 'all' as const },
                  },
              ]
            : []),
        ...(controls.sort !== 'latest'
            ? [
                  {
                      key: 'sort',
                      label: t(`sorts.${controls.sort}`),
                      overrides: { sort: 'latest' as const },
                  },
              ]
            : []),
        ...(controls.tag
            ? [
                  {
                      key: 'tag',
                      label: `#${controls.tag}`,
                      overrides: { tag: '' },
                  },
              ]
            : []),
        ...(controls.collection
            ? [
                  {
                      key: 'collection',
                      label: collection?.title[locale] ?? controls.collection,
                      overrides: { collection: '' },
                  },
              ]
            : []),
    ]
    if (!selections.length) return null

    return (
        <nav
            aria-label={t('active')}
            data-testid="docs-index-active-filters"
            className="flex min-w-0 flex-wrap gap-2"
        >
            {selections.map(({ key, label, overrides }) => (
                <Link
                    key={key}
                    href={getDocsIndexHref({ controls, keyword, overrides })}
                    aria-label={t('remove', { label })}
                    data-touch-target="docs-index"
                    className="ds-focus-ring inline-flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 text-sm text-(--docs-interactive-text)"
                >
                    <span className="min-w-0 break-words">{label}</span>
                    <X aria-hidden="true" className="size-3.5 shrink-0" />
                </Link>
            ))}
        </nav>
    )
}

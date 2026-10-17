import type { SearchData } from '~/lib/get-search-data'
import type { DocsIndexSectionFilterConfig } from './docs-index-config.types'
import { normalizeSearchQuery } from '../../../shared/lib/search-query.ts'
import {
    isInContentCollection,
    normalizeContentTag,
} from './content-collections.ts'

export const DOCS_INDEX_SECTION_FILTERS = [
    { value: 'all', section: null, messageKey: 'all' },
    { value: 'web', section: 'Web', messageKey: 'web' },
    { value: 'uiux', section: 'UI/UX', messageKey: 'uiux' },
    { value: 'backend', section: 'Backend', messageKey: 'backend' },
    {
        value: 'infrastructure',
        section: 'Infrastructure',
        messageKey: 'infrastructure',
    },
    {
        value: 'computer-science',
        section: 'Computer Science',
        messageKey: 'computerscience',
    },
    { value: 'docs', section: 'Docs', messageKey: 'docs' },
] as const satisfies readonly DocsIndexSectionFilterConfig[]

export const DOCS_INDEX_SORT_OPTIONS = ['latest', 'title', 'section'] as const

export type DocsIndexSectionFilter =
    (typeof DOCS_INDEX_SECTION_FILTERS)[number]['value']
export type DocsIndexSortOption = (typeof DOCS_INDEX_SORT_OPTIONS)[number]

export type DocsIndexControls = {
    section: DocsIndexSectionFilter
    sort: DocsIndexSortOption
    tag?: string
    collection?: string
}

type RawDocsIndexControls = {
    section?: string
    sort?: string
    tag?: string
    collection?: string
}

const DEFAULT_DOCS_INDEX_CONTROLS: DocsIndexControls = {
    section: 'all',
    sort: 'latest',
}

function isSectionFilter(value: string): value is DocsIndexSectionFilter {
    return DOCS_INDEX_SECTION_FILTERS.some((filter) => filter.value === value)
}

function isSortOption(value: string): value is DocsIndexSortOption {
    return DOCS_INDEX_SORT_OPTIONS.some((option) => option === value)
}

function normalizeDateValue(date?: string) {
    if (!date) {
        return 0
    }

    const time = new Date(date).getTime()

    return Number.isNaN(time) ? 0 : time
}

export function resolveDocsIndexControls(
    input: RawDocsIndexControls
): DocsIndexControls {
    const section = input.section?.trim() ?? ''
    const sort = input.sort?.trim() ?? ''

    return {
        section: isSectionFilter(section)
            ? section
            : DEFAULT_DOCS_INDEX_CONTROLS.section,
        sort: isSortOption(sort) ? sort : DEFAULT_DOCS_INDEX_CONTROLS.sort,
        ...(normalizeContentTag(input.tag)
            ? { tag: normalizeContentTag(input.tag) }
            : {}),
        ...(input.collection?.trim()
            ? { collection: input.collection.trim().slice(0, 64) }
            : {}),
    }
}

export function applyDocsIndexControls(
    docs: SearchData[],
    controls: DocsIndexControls
) {
    const filteredDocs = filterDocsIndexControls(docs, controls)

    return [...filteredDocs].sort((a, b) => {
        if (controls.sort === 'title') {
            return (a.title ?? a.slug).localeCompare(b.title ?? b.slug, [
                'ko',
                'en',
            ])
        }

        if (controls.sort === 'section') {
            const sectionSort = a.section.localeCompare(b.section, ['ko', 'en'])

            if (sectionSort !== 0) {
                return sectionSort
            }

            return normalizeDateValue(b.date) - normalizeDateValue(a.date)
        }

        return normalizeDateValue(b.date) - normalizeDateValue(a.date)
    })
}

export function filterDocsIndexControls(
    docs: SearchData[],
    controls: DocsIndexControls
) {
    const sectionFilter = DOCS_INDEX_SECTION_FILTERS.find(
        (filter) => filter.value === controls.section
    )

    return docs.filter((doc) => {
        const matchesSection =
            !sectionFilter?.section || doc.section === sectionFilter.section

        const matchesTag =
            !controls.tag ||
            doc.tags?.some(
                (tag) =>
                    normalizeContentTag(tag) ===
                    normalizeContentTag(controls.tag)
            )
        const matchesCollection =
            !controls.collection ||
            isInContentCollection(doc, controls.collection)
        return matchesSection && matchesTag && matchesCollection
    })
}

export function getDocsIndexHref({
    controls,
    overrides = {},
    page,
    keyword,
}: {
    controls: DocsIndexControls
    overrides?: Partial<DocsIndexControls>
    page?: number
    keyword?: string
}) {
    const nextControls = {
        ...controls,
        ...overrides,
    }
    const params = new URLSearchParams()

    const query = normalizeSearchQuery(keyword)
    if (query) {
        params.set('q', query)
    }

    if (page && page > 1) {
        params.set('page', String(page))
    }

    if (nextControls.section !== DEFAULT_DOCS_INDEX_CONTROLS.section) {
        params.set('section', nextControls.section)
    }

    if (nextControls.sort !== DEFAULT_DOCS_INDEX_CONTROLS.sort) {
        params.set('sort', nextControls.sort)
    }

    const tag = normalizeContentTag(nextControls.tag)
    if (tag) params.set('tag', tag)
    if (nextControls.collection)
        params.set('collection', nextControls.collection)

    const queryString = params.toString()

    return queryString ? `/docs?${queryString}` : '/docs'
}

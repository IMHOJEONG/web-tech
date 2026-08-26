import type { SearchData } from '~/lib/get-search-data'

export const DOCS_INDEX_SECTION_FILTERS = [
    { value: 'all', section: null, messageKey: 'all' },
    { value: 'web', section: 'Web', messageKey: 'web' },
    { value: 'uiux', section: 'UI/UX', messageKey: 'uiux' },
    { value: 'backend', section: 'Backend', messageKey: 'backend' },
    {
        value: 'computer-science',
        section: 'Computer Science',
        messageKey: 'computerscience',
    },
    { value: 'docs', section: 'Docs', messageKey: 'docs' },
] as const

export const DOCS_INDEX_SOURCE_FILTERS = ['all', 'local', 'remote'] as const
export const DOCS_INDEX_SORT_OPTIONS = ['latest', 'title', 'section'] as const

export type DocsIndexSectionFilter =
    (typeof DOCS_INDEX_SECTION_FILTERS)[number]['value']
export type DocsIndexSourceFilter = (typeof DOCS_INDEX_SOURCE_FILTERS)[number]
export type DocsIndexSortOption = (typeof DOCS_INDEX_SORT_OPTIONS)[number]

export type DocsIndexControls = {
    section: DocsIndexSectionFilter
    source: DocsIndexSourceFilter
    sort: DocsIndexSortOption
}

type RawDocsIndexControls = {
    section?: string
    source?: string
    sort?: string
}

const DEFAULT_DOCS_INDEX_CONTROLS: DocsIndexControls = {
    section: 'all',
    source: 'all',
    sort: 'latest',
}

function isSectionFilter(value: string): value is DocsIndexSectionFilter {
    return DOCS_INDEX_SECTION_FILTERS.some((filter) => filter.value === value)
}

function isSourceFilter(value: string): value is DocsIndexSourceFilter {
    return DOCS_INDEX_SOURCE_FILTERS.includes(value as DocsIndexSourceFilter)
}

function isSortOption(value: string): value is DocsIndexSortOption {
    return DOCS_INDEX_SORT_OPTIONS.includes(value as DocsIndexSortOption)
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
    const source = input.source?.trim() ?? ''
    const sort = input.sort?.trim() ?? ''

    return {
        section: isSectionFilter(section)
            ? section
            : DEFAULT_DOCS_INDEX_CONTROLS.section,
        source: isSourceFilter(source)
            ? source
            : DEFAULT_DOCS_INDEX_CONTROLS.source,
        sort: isSortOption(sort) ? sort : DEFAULT_DOCS_INDEX_CONTROLS.sort,
    }
}

export function applyDocsIndexControls(
    docs: SearchData[],
    controls: DocsIndexControls
) {
    const sectionFilter = DOCS_INDEX_SECTION_FILTERS.find(
        (filter) => filter.value === controls.section
    )
    const filteredDocs = docs.filter((doc) => {
        const matchesSection =
            !sectionFilter?.section || doc.section === sectionFilter.section
        const matchesSource =
            controls.source === 'all' || doc.contentSource === controls.source

        return matchesSection && matchesSource
    })

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

    if (keyword?.trim()) {
        params.set('q', keyword.trim())
    }

    if (page && page > 1) {
        params.set('page', String(page))
    }

    if (nextControls.section !== DEFAULT_DOCS_INDEX_CONTROLS.section) {
        params.set('section', nextControls.section)
    }

    if (nextControls.source !== DEFAULT_DOCS_INDEX_CONTROLS.source) {
        params.set('source', nextControls.source)
    }

    if (nextControls.sort !== DEFAULT_DOCS_INDEX_CONTROLS.sort) {
        params.set('sort', nextControls.sort)
    }

    const queryString = params.toString()

    return queryString ? `/docs?${queryString}` : '/docs'
}

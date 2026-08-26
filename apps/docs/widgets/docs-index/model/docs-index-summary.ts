import type { SearchData } from '~/lib/get-search-data'

export const DOCS_INDEX_SECTION_ORDER = [
    'Web',
    'UI/UX',
    'Backend',
    'Computer Science',
    'Docs',
] as const

export type DocsIndexSectionKey = (typeof DOCS_INDEX_SECTION_ORDER)[number]

export const DOCS_INDEX_SECTION_HREFS: Record<DocsIndexSectionKey, string> = {
    Web: '/web',
    'UI/UX': '/ui-ux',
    Backend: '/category/be',
    'Computer Science': '/category/computer-science',
    Docs: '/docs',
}

export function getDocsIndexSectionMessageKey(section: DocsIndexSectionKey) {
    switch (section) {
        case 'Web':
            return 'web'
        case 'UI/UX':
            return 'uiux'
        case 'Backend':
            return 'backend'
        case 'Computer Science':
            return 'computerscience'
        case 'Docs':
            return 'docs'
    }
}

export function getDocsIndexSectionSummary(docs: SearchData[]) {
    const counts = new Map<string, number>()
    const latestDates = new Map<string, string>()

    docs.forEach((doc) => {
        const currentCount = counts.get(doc.section) ?? 0
        counts.set(doc.section, currentCount + 1)

        if (!latestDates.has(doc.section) && doc.date) {
            latestDates.set(doc.section, doc.date)
        }
    })

    return DOCS_INDEX_SECTION_ORDER.filter((section) =>
        counts.has(section)
    ).map((section) => ({
        key: section,
        href: DOCS_INDEX_SECTION_HREFS[section],
        count: counts.get(section) ?? 0,
        latest: latestDates.get(section),
    }))
}

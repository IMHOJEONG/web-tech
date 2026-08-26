import assert from 'node:assert/strict'
import test from 'node:test'
import type { SearchData } from '~/lib/get-search-data'
import {
    getDocsIndexSectionMessageKey,
    getDocsIndexSectionSummary,
} from './docs-index-summary.ts'

function createDoc(overrides: Partial<SearchData> = {}): SearchData {
    return {
        id: 'doc-1',
        title: 'React Guide',
        summary: 'React rendering notes',
        content: 'React rendering notes',
        slug: 'react-guide',
        fileName: 'category/fe/react/react-guide',
        date: '2026-08-24',
        thumbnail: null,
        href: '/category/fe/react/react-guide',
        section: 'Web',
        contentSource: 'local',
        ...overrides,
    }
}

test('getDocsIndexSectionMessageKey maps section labels to message keys', () => {
    assert.equal(getDocsIndexSectionMessageKey('Web'), 'web')
    assert.equal(
        getDocsIndexSectionMessageKey('Computer Science'),
        'computerscience'
    )
})

test('getDocsIndexSectionSummary counts known sections in display order', () => {
    const summary = getDocsIndexSectionSummary([
        createDoc({ id: 'docs', section: 'Docs' }),
        createDoc({ id: 'web-1', section: 'Web', date: '2026-08-24' }),
        createDoc({ id: 'web-2', section: 'Web', date: '2026-08-20' }),
        createDoc({ id: 'backend', section: 'Backend' }),
    ])

    assert.deepEqual(
        summary.map((section) => [section.key, section.count]),
        [
            ['Web', 2],
            ['Backend', 1],
            ['Docs', 1],
        ]
    )
    assert.equal(summary[0]?.latest, '2026-08-24')
})

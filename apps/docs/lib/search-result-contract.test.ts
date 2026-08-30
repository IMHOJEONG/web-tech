import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildSearchResultItem,
    buildSearchResultItems,
} from './search-result-contract.ts'
import type { SearchData } from './get-search-data'

function createDoc(overrides: Partial<SearchData> = {}): SearchData {
    return {
        id: 'doc-1',
        title: 'React Suspense Guide',
        summary: 'A guide for suspense boundaries and streaming UI.',
        content: 'React suspense boundaries and async rendering.',
        slug: 'react-suspense-guide',
        fileName: 'data/react-suspense-guide',
        href: '/docs/web/react-suspense-guide',
        section: 'Web',
        contentSource: 'local',
        ...overrides,
    }
}

test('buildSearchResultItem carries preview derived from the shared preview helper', () => {
    const result = buildSearchResultItem(
        createDoc({
            summary: 'React suspense boundaries are explained here.',
        }),
        'react suspense'
    )

    assert.equal(result.slug, 'react-suspense-guide')
    assert.match(result.preview.titleHtml, /search-highlight/)
    assert.match(result.preview.excerptHtml, /search-highlight/)
})

test('buildSearchResultItems preserves order and shape for API/page consumers', () => {
    const results = buildSearchResultItems(
        [
            createDoc({ id: 'doc-1', slug: 'first' }),
            createDoc({ id: 'doc-2', slug: 'second' }),
        ],
        'react'
    )

    assert.equal(results.length, 2)
    assert.deepEqual(
        results.map((result) => result.slug),
        ['first', 'second']
    )
    assert.ok(
        results.every((result) => typeof result.preview.titleHtml === 'string')
    )
})

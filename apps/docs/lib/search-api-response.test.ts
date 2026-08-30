import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSearchApiResponse } from './search-api-response.ts'
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

test('buildSearchApiResponse trims query and preserves result count', () => {
    const response = buildSearchApiResponse([createDoc()], '  react  ')

    assert.equal(response.query, 'react')
    assert.equal(response.count, 1)
    assert.equal(response.results[0]?.slug, 'react-suspense-guide')
})

test('buildSearchApiResponse returns shared preview fields for every result', () => {
    const response = buildSearchApiResponse(
        [
            createDoc({
                id: 'doc-1',
                summary: 'React suspense is highlighted here.',
            }),
        ],
        'react suspense'
    )

    assert.match(
        response.results[0]?.preview.titleHtml ?? '',
        /search-highlight/
    )
    assert.match(
        response.results[0]?.preview.excerptHtml ?? '',
        /search-highlight/
    )
})

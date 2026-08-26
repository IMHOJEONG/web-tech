import assert from 'node:assert/strict'
import test from 'node:test'
import type { SearchData } from '~/lib/get-search-data'
import {
    applyDocsIndexControls,
    getDocsIndexHref,
    resolveDocsIndexControls,
} from './docs-index-controls.ts'

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

test('resolveDocsIndexControls falls back to safe defaults', () => {
    assert.deepEqual(
        resolveDocsIndexControls({
            section: 'unknown',
            source: 'external',
            sort: 'popular',
        }),
        {
            section: 'all',
            source: 'all',
            sort: 'latest',
        }
    )
})

test('applyDocsIndexControls filters by section and source', () => {
    const docs = [
        createDoc(),
        createDoc({
            id: 'doc-2',
            title: 'API Guide',
            slug: 'api-guide',
            section: 'Backend',
            contentSource: 'remote',
        }),
    ]

    const filtered = applyDocsIndexControls(docs, {
        section: 'backend',
        source: 'remote',
        sort: 'latest',
    })

    assert.deepEqual(
        filtered.map((doc) => doc.id),
        ['doc-2']
    )
})

test('applyDocsIndexControls sorts by title when requested', () => {
    const docs = [
        createDoc({ id: 'b', title: 'Zeta' }),
        createDoc({ id: 'a', title: 'Alpha' }),
    ]

    const sorted = applyDocsIndexControls(docs, {
        section: 'all',
        source: 'all',
        sort: 'title',
    })

    assert.deepEqual(
        sorted.map((doc) => doc.id),
        ['a', 'b']
    )
})

test('getDocsIndexHref omits default controls from query string', () => {
    const controls = resolveDocsIndexControls({})

    assert.equal(getDocsIndexHref({ controls }), '/docs')
    assert.equal(
        getDocsIndexHref({
            controls,
            overrides: { section: 'web', source: 'local', sort: 'title' },
            page: 2,
        }),
        '/docs?page=2&section=web&source=local&sort=title'
    )
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
    resolveDocsSearchPageState,
    RECOMMENDED_SEARCH_TERMS,
} from './docs-search-page-state.ts'
import type { SearchData } from './get-search-data'

function createDoc(overrides: Partial<SearchData> = {}): SearchData {
    return {
        id: 'doc-1',
        title: 'React Suspense Guide',
        summary: 'Weighted search helps this show up first.',
        content: 'React suspense boundaries and async rendering.',
        slug: 'react-suspense-guide',
        fileName: 'data/react-suspense-guide',
        date: '2026-08-08',
        thumbnail: null,
        href: '/docs/web/react-suspense-guide',
        section: 'Web',
        contentSource: 'local',
        ...overrides,
    }
}

test('recommended search terms remain fixed for docs search entry points', () => {
    assert.deepEqual(RECOMMENDED_SEARCH_TERMS, [
        'React',
        'Astro',
        'Accessibility',
        'V8',
        'Node.js',
        'OS',
    ])
})

test('resolveDocsSearchPageState returns empty-all-docs when base docs index is empty', () => {
    const state = resolveDocsSearchPageState({
        query: undefined,
        docs: [],
        searchResults: [],
    })

    assert.deepEqual(state, {
        mode: 'empty-all-docs',
    })
})

test('resolveDocsSearchPageState returns empty-search when keyword has no matches', () => {
    const state = resolveDocsSearchPageState({
        query: '  react  ',
        docs: [createDoc()],
        searchResults: [],
    })

    assert.deepEqual(state, {
        mode: 'empty-search',
        keyword: 'react',
    })
})

test('resolveDocsSearchPageState returns index mode when query is missing', () => {
    const docs = [createDoc()]
    const state = resolveDocsSearchPageState({
        query: undefined,
        docs,
        searchResults: [],
    })

    assert.deepEqual(state, {
        mode: 'index',
        docs,
    })
})

test('resolveDocsSearchPageState returns search-results with ranked docs when matches exist', () => {
    const rankedDocs = [
        createDoc({
            id: 'doc-1',
            slug: 'react-suspense-guide',
            href: '/docs/web/react-suspense-guide',
        }),
        createDoc({
            id: 'doc-2',
            slug: 'react-streaming-notes',
            title: 'React Streaming Notes',
            href: '/docs/web/react-streaming-notes',
        }),
    ]

    const state = resolveDocsSearchPageState({
        query: 'react',
        docs: [],
        searchResults: rankedDocs,
    })

    assert.deepEqual(state, {
        mode: 'search-results',
        keyword: 'react',
        docs: rankedDocs,
    })
})

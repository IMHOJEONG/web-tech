import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSearchPreview, highlightSearchText } from './search-preview.ts'
import type { SearchData } from './get-search-data'

function createDoc(overrides: Partial<SearchData> = {}): SearchData {
    return {
        id: 'doc-1',
        title: 'React Suspense Guide',
        summary: 'A guide for suspense boundaries and streaming UI.',
        content:
            'This article explains suspense boundaries, streaming UI, and server rendering in React applications.',
        slug: 'react-suspense-guide',
        fileName: 'data/react-suspense-guide',
        href: '/docs/web/react-suspense-guide',
        section: 'Web',
        contentSource: 'local',
        ...overrides,
    }
}

test('highlightSearchText escapes html before applying marks', () => {
    const html = highlightSearchText('<script>alert(1)</script> React', 'react')

    assert.doesNotMatch(html, /<script>/i)
    assert.match(html, /<mark/)
    assert.match(html, /React<\/mark>/)
})

test('buildSearchPreview prefers summary match when keyword appears there', () => {
    const preview = buildSearchPreview(
        createDoc({
            summary: 'React suspense is highlighted here first.',
            content:
                'Longer body content that also mentions React suspense later.',
        }),
        'react suspense'
    )

    assert.match(preview.titleHtml, /<mark/)
    assert.match(preview.excerptHtml, /highlighted here first/)
    assert.match(preview.excerptHtml, /<mark/)
})

test('buildSearchPreview falls back to body excerpt when summary misses keyword', () => {
    const preview = buildSearchPreview(
        createDoc({
            summary: 'A short summary without the query terms.',
            content:
                'This longer note explains network timeout behavior for remote content fetches and retry boundaries.',
        }),
        'network timeout'
    )

    assert.match(preview.excerptHtml, /network/)
    assert.match(preview.excerptHtml, /<mark/)
})

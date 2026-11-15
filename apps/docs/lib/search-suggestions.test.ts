import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildSearchSuggestions,
    SEARCH_SUGGESTION_LIMIT,
    isSearchSuggestionsResponse,
} from './search-suggestions.ts'
import type { SearchData } from './get-search-data'

const doc = (index = 0): SearchData => ({
    id: `doc-${index}`,
    title: `React ${index}`,
    summary: 'A short summary',
    content: 'Synthetic body not intended for autocomplete',
    slug: `react-${index}`,
    fileName: `web/react-${index}`,
    href: `/docs/web/react-${index}`,
    section: 'Web',
    contentSource: 'local',
    tags: ['react', 'React', 'react-query'],
    readMinutes: 3,
})

test('suggestions cap lightweight results while preserving full count and ranking', () => {
    const docs = Array.from({ length: 20 }, (_, i) => doc(i))
    const result = buildSearchSuggestions(docs, '  React  ')
    assert.equal(result.query, 'React')
    assert.equal(result.count, 20)
    assert.equal(result.results.length, SEARCH_SUGGESTION_LIMIT)
    assert.deepEqual(
        result.results.map((x) => x.id),
        docs.slice(0, 8).map((x) => x.id)
    )
    assert.equal('content' in result.results[0]!, false)
    assert.equal('preview' in result.results[0]!, false)
    assert.equal('contentSource' in result.results[0]!, false)
    assert.deepEqual(result.suggestions, ['react-query'])
})

test('empty query has recommendations; empty result is not an error', () => {
    const result = buildSearchSuggestions([], '')
    assert.equal(result.count, 0)
    assert.deepEqual(result.results, [])
    assert.equal(result.suggestions.length, 5)
})

test('first query and Unicode limit match the shared input contract', () => {
    assert.equal(buildSearchSuggestions([], ['', 'ignored']).query, '')
    assert.equal(
        buildSearchSuggestions([], ['🙂'.repeat(45), 'ignored']).query,
        '🙂'.repeat(40)
    )
})

test('titles fall back to slug and text fields are bounded without HTML rendering', () => {
    const result = buildSearchSuggestions([
        { ...doc(), title: '', summary: 'x'.repeat(300) },
    ])
    assert.equal(result.results[0]?.title, 'react-0')
    assert.equal(result.results[0]?.summary.length, 180)
})

test('malformed or external navigation responses fail validation', () => {
    const valid = buildSearchSuggestions([doc()])
    assert.equal(isSearchSuggestionsResponse(valid), true)
    for (const invalid of [
        null,
        {},
        { ...valid, count: -1 },
        { ...valid, suggestions: null },
        {
            ...valid,
            results: [{ ...valid.results[0], href: '//example.invalid' }],
        },
        {
            ...valid,
            results: [{ ...valid.results[0], href: '/\\example.invalid' }],
        },
    ]) {
        assert.equal(isSearchSuggestionsResponse(invalid), false)
    }
})

test('space-containing document paths remain valid without double encoding', () => {
    const docs = [
        { ...doc(0), href: '/docs/web/space in name' },
        { ...doc(1), href: '/docs/web/already%20encoded' },
        { ...doc(2), href: '/docs/web/한글 이름' },
    ]
    const response = buildSearchSuggestions(docs)
    assert.equal(isSearchSuggestionsResponse(response), true)
    assert.deepEqual(
        response.results.map((item) => item.href),
        [
            '/docs/web/space%20in%20name',
            '/docs/web/already%20encoded',
            '/docs/web/한글%20이름',
        ]
    )
    assert.equal(docs[0]?.href, '/docs/web/space in name')
})

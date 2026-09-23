import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getSearchHref,
    limitSearchInput,
    normalizeSearchQuery,
} from '../shared/lib/search-query.ts'
import { buildSearchApiResponse } from './search-api-response.ts'
import { resolveDocsSearchPageState } from './docs-search-page-state.ts'

test('query policy handles missing, repeated, whitespace and composed input', () => {
    assert.equal(normalizeSearchQuery(null), '')
    assert.equal(normalizeSearchQuery([]), '')
    assert.equal(normalizeSearchQuery(['', 'React']), '')
    assert.equal(normalizeSearchQuery([' React ', 'Vue']), 'React')
    assert.equal(
        normalizeSearchQuery(' \tReact\n  Suspense\u00a0 '),
        'React Suspense'
    )
    assert.equal(normalizeSearchQuery('한글'), '한글')
})

test('query limit counts 40 Unicode code points without broken emoji', () => {
    assert.equal(limitSearchInput('한'.repeat(41)), '한'.repeat(40))
    assert.equal(limitSearchInput('🙂'.repeat(41)), '🙂'.repeat(40))
    assert.equal(normalizeSearchQuery('a'.repeat(39) + '  b'), 'a'.repeat(39))
    assert.equal(limitSearchInput(' React '), ' React ')
})

test('page state, API response and href share the effective query', () => {
    const query = '  ' + '한'.repeat(45) + '  '
    const expected = '한'.repeat(40)
    assert.equal(buildSearchApiResponse([], query).query, expected)
    const state = resolveDocsSearchPageState({
        query: [query, 'ignored'],
        docs: [],
        searchResults: [],
    })
    assert.equal(state.mode, 'empty-search')
    if (state.mode === 'empty-search') assert.equal(state.keyword, expected)
    assert.equal(
        new URL(getSearchHref(query), 'https://example.test').searchParams.get(
            'q'
        ),
        expected
    )
    assert.equal(getSearchHref(' \n '), '/docs')
    assert.equal(normalizeSearchQuery(normalizeSearchQuery(query)), expected)
})

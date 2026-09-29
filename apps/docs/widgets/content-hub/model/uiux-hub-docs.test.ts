import assert from 'node:assert/strict'
import test from 'node:test'
import type { SearchData } from '~/lib/get-search-data'
import { selectUiUxHubDocs } from './uiux-hub-docs.ts'

function fixture(index: number): SearchData {
    return {
        id: `uiux-${index}`,
        title: `Article ${index}`,
        summary: `Summary ${index}`,
        content: '',
        slug: `article-${index}`,
        fileName: `ui-ux/article-${index}`,
        href: `/docs/ui-ux/article-${index}`,
        section: 'UI/UX',
        contentSource: index % 2 ? 'remote' : 'local',
    }
}

for (const count of [0, 1, 2, 3, 4, 5, 7, 8]) {
    test(`${count} articles: preserves real destinations without filler cards`, () => {
        const input = Array.from({ length: count }, (_, index) =>
            fixture(index)
        )
        const result = selectUiUxHubDocs(input)
        const cards = [
            ...result.featured,
            ...(result.spotlight ? [result.spotlight] : []),
            ...result.more,
        ]
        assert.equal(result.isEmpty, count === 0)
        assert.equal(result.featured.length, Math.min(count, 3))
        assert.equal(Boolean(result.spotlight), count >= 4)
        assert.equal(result.more.length, Math.min(Math.max(count - 4, 0), 3))
        assert.deepEqual(cards, input.slice(0, 7))
        assert.equal(new Set(cards.map((doc) => doc.href)).size, cards.length)
    })
}

test('filters missing titles and destinations before selecting slots', () => {
    const result = selectUiUxHubDocs([
        { ...fixture(0), title: ' ' },
        { ...fixture(1), href: '' },
        fixture(2),
    ])
    assert.deepEqual(result.featured, [fixture(2)])
    assert.equal(result.spotlight, null)
    assert.deepEqual(result.more, [])
})

test('normalizes display text without inventing summaries and deduplicates by destination', () => {
    const input = {
        ...fixture(0),
        title: ' Article ',
        href: ' /docs/ui-ux/article-0 ',
        summary: undefined,
    }
    const result = selectUiUxHubDocs([input, fixture(0)])
    assert.equal(result.featured.length, 1)
    assert.equal(result.featured[0]?.title, 'Article')
    assert.equal(result.featured[0]?.summary, '')
    assert.equal(input.title, ' Article ')
})

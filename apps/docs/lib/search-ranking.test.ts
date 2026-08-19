import test from 'node:test'
import assert from 'node:assert/strict'
import {
    rankSearchDocs,
    scoreSearchDoc,
    type SearchRankableDoc,
} from './search-ranking.ts'

function createDoc(overrides: Partial<SearchRankableDoc>): SearchRankableDoc {
    return {
        title: 'Default title',
        summary: 'Default summary',
        slug: 'default-title',
        fileName: 'data/default-title',
        section: 'Docs',
        content: 'Default content body',
        date: '2026-08-01',
        ...overrides,
    }
}

test('scoreSearchDoc prefers title matches over content-only matches', () => {
    const titleMatch = createDoc({
        title: 'React Suspense Guide',
        slug: 'react-suspense-guide',
        fileName: 'data/react-suspense-guide',
    })
    const contentMatch = createDoc({
        title: 'Async Rendering Notes',
        slug: 'async-rendering-notes',
        fileName: 'data/async-rendering-notes',
        content: 'This article explains react suspense boundaries in depth.',
    })

    assert.ok(
        scoreSearchDoc(titleMatch, 'react suspense') >
            scoreSearchDoc(contentMatch, 'react suspense')
    )
})

test('rankSearchDocs orders summary matches ahead of weaker content matches', () => {
    const docs = [
        createDoc({
            title: 'Caching Memo',
            slug: 'caching-memo',
            summary: 'Network timeout troubleshooting checklist',
            fileName: 'data/caching-memo',
            date: '2026-08-02',
        }),
        createDoc({
            title: 'Server Diary',
            slug: 'server-diary',
            fileName: 'data/server-diary',
            content: 'A short note about a network timeout observed in logs.',
            date: '2026-08-03',
        }),
    ]

    const ranked = rankSearchDocs(docs, 'network timeout')

    assert.equal(ranked[0]?.slug, 'caching-memo')
    assert.equal(ranked[1]?.slug, 'server-diary')
})

test('rankSearchDocs uses section and path context for category-oriented queries', () => {
    const docs = [
        createDoc({
            title: 'Accessibility checklist',
            slug: 'accessibility-checklist',
            fileName: 'category/computer-science/os/accessibility-checklist',
            section: 'Computer Science',
            content: 'Stable systems and accessibility sometimes intersect.',
        }),
        createDoc({
            title: 'Stable layout tricks',
            slug: 'stable-layout-tricks',
            fileName: 'data/stable-layout-tricks',
            section: 'Docs',
            content: 'General note about stable layouts.',
        }),
    ]

    const ranked = rankSearchDocs(docs, 'computer science')

    assert.equal(ranked[0]?.slug, 'accessibility-checklist')
    assert.equal(ranked.length, 1)
})

test('rankSearchDocs requires every token in the query to exist somewhere in the document', () => {
    const docs = [
        createDoc({
            title: 'React transitions',
            slug: 'react-transitions',
            fileName: 'data/react-transitions',
            content: 'Guide for transitions in React.',
        }),
        createDoc({
            title: 'React suspense guide',
            slug: 'react-suspense-guide',
            fileName: 'data/react-suspense-guide',
            content: 'React suspense boundaries and streaming UI.',
        }),
    ]

    const ranked = rankSearchDocs(docs, 'react suspense')

    assert.deepEqual(
        ranked.map((doc) => doc.slug),
        ['react-suspense-guide']
    )
})

test('rankSearchDocs falls back to newer content when scores tie', () => {
    const docs = [
        createDoc({
            title: 'Latency budget',
            slug: 'latency-budget-old',
            fileName: 'data/latency-budget-old',
            summary: 'Latency budget',
            date: '2026-08-01',
        }),
        createDoc({
            title: 'Latency budget',
            slug: 'latency-budget-new',
            fileName: 'data/latency-budget-new',
            summary: 'Latency budget',
            date: '2026-08-05',
        }),
    ]

    const ranked = rankSearchDocs(docs, 'latency budget')

    assert.deepEqual(
        ranked.map((doc) => doc.slug),
        ['latency-budget-new', 'latency-budget-old']
    )
})

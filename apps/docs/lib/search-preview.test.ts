import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSearchPreview, highlightSearchText } from './search-preview.ts'
import type { SearchData } from './get-search-data'
import {
    getSearchPreviewText,
    SEARCH_PREVIEW_INPUT_LIMIT,
} from './search-preview-text.ts'

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

test('search excerpts remove Markdown structure before matching and highlighting', () => {
    const preview = buildSearchPreview(
        createDoc({
            summary: 'Overview',
            content:
                '### React runtime\n\n**React Effect** and `foo_bar` are different. ![React diagram](/diagram.png) [Read React](https://example.test)\n```tsx\nReact.useState(false)\n```',
        }),
        'react'
    )
    assert.doesNotMatch(preview.excerptHtml, /###|\*\*|`|!\[|\]\(/)
    assert.match(preview.excerptHtml, /React<\/mark>/)
    assert.match(preview.excerptHtml, /foo_bar/)
})

test('preview text remains inert after stripping markup and decoding entities', () => {
    const preview = buildSearchPreview(
        createDoc({
            summary: '',
            content:
                '<script>bad()</script><p>React &lt;img onerror=bad()&gt;</p>',
        }),
        'react'
    )
    assert.doesNotMatch(preview.excerptHtml, /<script|<img|bad\(\)<\/script/)
    assert.match(preview.excerptHtml, /&lt;img/)
    assert.equal(
        getSearchPreviewText('## Title\n- **text**\n> _note_'),
        'Title text note'
    )
})

test('large malformed Markdown does not discard searchable text', () => {
    assert.match(getSearchPreviewText('['.repeat(20_000) + ' React'), /React$/)
})

test('raw angle brackets in Markdown code remain visible but never become HTML', () => {
    const preview = buildSearchPreview(
        createDoc({
            summary: '',
            content: 'Use `<Button>` and `useState<State>`.',
        }),
        'button'
    )
    assert.match(preview.excerptHtml, /&lt;<mark[^>]*>Button<\/mark>&gt;/)
    assert.doesNotMatch(preview.excerptHtml, /<Button>/)
    assert.equal(
        getSearchPreviewText('```html\n<Button>safe</Button>\n```'),
        '<Button>safe</Button>'
    )
})

test('preview normalization is bounded while a late body match still gets context', () => {
    assert.equal(
        getSearchPreviewText('x'.repeat(SEARCH_PREVIEW_INPUT_LIMIT * 4)).length,
        SEARCH_PREVIEW_INPUT_LIMIT
    )
    const preview = buildSearchPreview(
        createDoc({
            summary: 'Overview',
            content:
                'x'.repeat(SEARCH_PREVIEW_INPUT_LIMIT * 4) +
                ' React late-body-match',
        }),
        'react'
    )
    assert.match(preview.excerptHtml, /React<\/mark>/)
    assert.match(preview.excerptHtml, /late-body-match/)
})

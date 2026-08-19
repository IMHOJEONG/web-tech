import test from 'node:test'
import assert from 'node:assert/strict'
import {
    formatRemotePayloadIssues,
    parseRemotePostsPayload,
    summarizeRemotePayloadShape,
    validateRemoteRouteContract,
} from './content-api-schema.ts'

test('validateRemoteRouteContract accepts canonical markdown paths', () => {
    const result = validateRemoteRouteContract({
        slug: 'pna',
        title: 'Private Network Access',
        markdownPath: 'feed/pna',
    })

    assert.equal(result.success, true)
})

test('parseRemotePostsPayload accepts top-level array payload', () => {
    const posts = parseRemotePostsPayload([
        {
            id: 1,
            slug: 'pna',
            title: 'Private Network Access',
            markdownPath: 'feed/pna',
            readMinutes: 5,
        },
    ])

    assert.equal(posts?.length, 1)
    assert.equal(posts?.[0]?.slug, 'pna')
    assert.equal(posts?.[0]?.readMinutes, 5)
})

test('parseRemotePostsPayload accepts results wrapper payload', () => {
    const posts = parseRemotePostsPayload({
        results: [
            {
                id: 'note-1',
                slug: 'browser-security',
                title: 'Browser Security',
                markdown_path: 'web/browser-security',
            },
        ],
    })

    assert.equal(posts?.length, 1)
    assert.equal(posts?.[0]?.markdown_path, 'web/browser-security')
})

test('parseRemotePostsPayload accepts items wrapper payload', () => {
    const posts = parseRemotePostsPayload({
        items: [
            {
                id: 'note-2',
                slug: 'ux-audit',
                title: 'UX Audit',
                markdownPath: 'ui-ux/ux-audit',
            },
        ],
    })

    assert.equal(posts?.length, 1)
    assert.equal(posts?.[0]?.markdownPath, 'ui-ux/ux-audit')
})

test('parseRemotePostsPayload rejects unsupported container shape', () => {
    const posts = parseRemotePostsPayload({
        data: [],
    })

    assert.equal(posts, null)
})

test('parseRemotePostsPayload rejects non-object post entries', () => {
    const posts = parseRemotePostsPayload({
        results: ['bad-entry'],
    })

    assert.equal(posts, null)
})

test('parseRemotePostsPayload rejects invalid date, status, and readMinutes fields', () => {
    const posts = parseRemotePostsPayload({
        results: [
            {
                id: 'note-3',
                slug: 'bad-contract',
                title: 'Bad Contract',
                markdownPath: 'feed/bad-contract',
                date: 'not-a-date',
                status: 'broken',
                readMinutes: 0,
            },
        ],
    })

    assert.equal(posts, null)
})

test('formatRemotePayloadIssues renders readable paths', () => {
    const message = formatRemotePayloadIssues([
        {
            path: ['results', 0, 'date'],
            message: 'must be a valid date-like value',
        },
        {
            path: ['results', 0, 'status'],
            message: 'Invalid option',
        },
    ])

    assert.match(message, /results\.0\.date/)
    assert.match(message, /results\.0\.status/)
})

test('summarizeRemotePayloadShape returns top-level payload hints for observability', () => {
    assert.deepEqual(summarizeRemotePayloadShape([{ id: 1 }]), {
        kind: 'array',
        itemCount: 1,
    })

    assert.deepEqual(
        summarizeRemotePayloadShape({
            results: [{ id: 1 }],
            meta: { page: 1 },
        }),
        {
            kind: 'object',
            keys: ['meta', 'results'],
            itemsCount: null,
            resultsCount: 1,
        }
    )
})

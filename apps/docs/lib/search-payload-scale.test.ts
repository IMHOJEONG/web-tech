import assert from 'node:assert/strict'
import test from 'node:test'
import {
    CONTENT_POSTS_MAX_BYTES,
    parseRemotePostsPayload,
} from '@web-tech/docs-content-contract'
import { createSearchPayloadFixture } from './search-payload-fixture.ts'
import { rankSearchDocs } from './search-ranking.ts'

test('a thousand long multibyte bodies preserve a match at the end without truncation', () => {
    const payload = createSearchPayloadFixture(1000, 8192)
    const json = JSON.stringify(payload)
    assert.ok(Buffer.byteLength(json) > CONTENT_POSTS_MAX_BYTES)
    const posts = parseRemotePostsPayload(JSON.parse(json))!
    assert.equal(posts.length, 1000)
    assert.ok(
        posts.every((post) => Buffer.byteLength(post.searchText!) === 8192)
    )
    const docs = posts.map((post) => ({
        title: post.title!,
        summary: post.summary!,
        slug: post.slug!,
        fileName: post.markdownPath!,
        section: 'Web',
        content: post.searchText!,
    }))
    const results = rankSearchDocs(docs, 'lastbodyneedle')
    assert.equal(results.length, 1)
    assert.equal(results[0]?.slug, 'probe-999')
    assert.equal(rankSearchDocs(docs, 'absentuniqueneedle').length, 0)
    // This is an offline cost/correctness fixture, not acceptance by the bounded HTTP loader.
})

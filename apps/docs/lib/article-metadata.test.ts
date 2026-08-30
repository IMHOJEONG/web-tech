import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildArticleMetadata } from './article-metadata.ts'

test('builds article metadata with canonical route and local thumbnail', () => {
    const metadata = buildArticleMetadata(
        {
            title: 'Event Loop Runtime',
            summary: 'How JavaScript scheduling works.',
            slug: 'javascript-event-loop-runtime',
            markdownPath: 'web/javascript-event-loop-runtime',
            thumbnail: '/web/browser/thumbnail.webp',
            date: '2026-08-23',
            updatedAt: '2026-08-24',
            authorName: 'HoJeong Im',
            tags: ['javascript', 'runtime'],
            topicLabel: 'WEB',
        },
        new URL('https://heap-forge.app')
    )

    assert.equal(metadata.title, 'Event Loop Runtime')
    assert.equal(metadata.description, 'How JavaScript scheduling works.')
    assert.equal(
        metadata.alternates?.canonical,
        'https://heap-forge.app/docs/web/javascript-event-loop-runtime'
    )
    assert.deepEqual(metadata.authors, [{ name: 'HoJeong Im' }])
    assert.deepEqual(metadata.keywords, ['javascript', 'runtime'])
    assert.deepEqual(metadata.twitter?.images, [
        'https://heap-forge.app/web/browser/thumbnail.webp',
    ])
    assert.deepEqual(metadata.openGraph?.images, [
        'https://heap-forge.app/web/browser/thumbnail.webp',
    ])
})

test('builds article metadata with remote thumbnail as-is', () => {
    const metadata = buildArticleMetadata(
        {
            title: 'Remote Post',
            summary: 'Remote summary.',
            slug: 'remote-post',
            markdownPath: 'feed/remote-post',
            thumbnail: 'https://assets.heap-forge.app/feed/remote.webp',
        },
        new URL('https://heap-forge.app')
    )

    assert.deepEqual(metadata.openGraph?.images, [
        'https://assets.heap-forge.app/feed/remote.webp',
    ])
})

test('falls back to default og image when article thumbnail is missing', () => {
    const metadata = buildArticleMetadata(
        {
            title: 'No Thumbnail',
            summary: 'No thumbnail summary.',
            slug: 'no-thumbnail',
            markdownPath: 'web/no-thumbnail',
        },
        new URL('https://heap-forge.app')
    )

    assert.deepEqual(metadata.twitter?.images, [
        'https://heap-forge.app/og-image.png',
    ])
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildArticleMetadata } from './article-metadata.ts'
import { getArticleOgImageUrl } from './article-sharing.ts'

test('metadata receives a copy of readonly document tags', () => {
    const tags = Object.freeze(['react'])
    const metadata = buildArticleMetadata({ tags })
    assert.deepEqual(metadata.keywords, tags)
    assert.notEqual(metadata.keywords, tags)
    if (Array.isArray(metadata.keywords)) metadata.keywords.push('nextjs')
    assert.deepEqual(tags, ['react'])
})

test('article metadata retains canonical and editorial fields with a title-based OG image', () => {
    const article = {
        title: 'Event Loop Runtime',
        summary: 'How JavaScript scheduling works.',
        markdownPath: 'web/javascript-event-loop-runtime',
        thumbnail: '/web/browser/thumbnail.webp',
        date: '2026-08-23',
        updatedAt: '2026-08-24',
        authorName: 'HoJeong Im',
        tags: ['javascript', 'runtime'],
        topicLabel: 'WEB',
    }
    const siteUrl = new URL('https://heap-forge.app')
    const metadata = buildArticleMetadata(article, siteUrl)
    const imageUrl = getArticleOgImageUrl(article, siteUrl)
    assert.equal(metadata.title, article.title)
    assert.equal(metadata.description, article.summary)
    assert.equal(
        metadata.alternates?.canonical,
        'https://heap-forge.app/docs/web/javascript-event-loop-runtime'
    )
    assert.deepEqual(metadata.authors, [{ name: 'HoJeong Im' }])
    assert.deepEqual(metadata.keywords, article.tags)
    assert.deepEqual(metadata.twitter?.images, [imageUrl])
    assert.deepEqual(metadata.openGraph?.images, [
        { url: imageUrl, width: 1200, height: 630, alt: article.title },
    ])
})

test('local, remote and missing thumbnails all use the same generated sharing image', () => {
    const article = { title: '공유 이미지', markdownPath: 'feed/share' }
    const siteUrl = new URL('https://heap-forge.app')
    for (const thumbnail of [
        '/local.webp',
        'https://assets.heap-forge.app/remote.webp',
        undefined,
    ]) {
        assert.deepEqual(
            buildArticleMetadata({ ...article, thumbnail }, siteUrl).twitter
                ?.images,
            [getArticleOgImageUrl(article, siteUrl)]
        )
    }
})

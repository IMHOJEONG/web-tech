import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPageMetadata } from './page-metadata.ts'

test('builds page metadata with canonical url and default image', () => {
    const metadata = buildPageMetadata(
        {
            title: 'Docs - HeapForge',
            description: 'Find every document in the HeapForge archive.',
            pathname: '/docs',
        },
        new URL('https://heap-forge.app')
    )

    assert.equal(metadata.title, 'Docs - HeapForge')
    assert.equal(metadata.alternates?.canonical, 'https://heap-forge.app/docs')
    assert.equal(metadata.openGraph?.url, 'https://heap-forge.app/docs')
    assert.deepEqual(metadata.openGraph?.images, [
        'https://heap-forge.app/og-image.png',
    ])
    assert.deepEqual(metadata.twitter?.images, [
        'https://heap-forge.app/og-image.png',
    ])
})

test('builds page metadata with og copy overrides and remote image', () => {
    const metadata = buildPageMetadata(
        {
            title: 'Feed - HeapForge',
            description: 'Curated technical writing.',
            ogTitle: 'HeapForge Feed',
            ogDescription: 'Read curated technical writing.',
            pathname: '/feed',
            image: 'https://assets.heap-forge.app/feed/thumbnail.webp',
        },
        new URL('https://heap-forge.app')
    )

    assert.equal(metadata.openGraph?.title, 'HeapForge Feed')
    assert.equal(
        metadata.twitter?.description,
        'Read curated technical writing.'
    )
    assert.deepEqual(metadata.openGraph?.images, [
        'https://assets.heap-forge.app/feed/thumbnail.webp',
    ])
})

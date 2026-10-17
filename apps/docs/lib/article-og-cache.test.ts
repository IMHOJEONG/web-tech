import assert from 'node:assert/strict'
import test from 'node:test'
import { ARTICLE_OG_CACHE_HEADERS } from './article-og-cache.ts'

test('OG cache headers separate browser and Vercel CDN TTLs', () => {
    assert.equal(
        ARTICLE_OG_CACHE_HEADERS['Cache-Control'],
        'public, max-age=3600'
    )
    assert.equal(
        ARTICLE_OG_CACHE_HEADERS['Vercel-CDN-Cache-Control'],
        'public, s-maxage=86400'
    )
    assert.equal(
        ARTICLE_OG_CACHE_HEADERS['Cache-Control'].includes('s-maxage'),
        false
    )
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    assertArticleBody,
    assertSitemapLocations,
} from './test-utils/assert-content-response.mjs'

test('article checks accept real text and reject script-only hydration markers', () => {
    assertArticleBody(
        '<article><h2>CACHE_BODY_V3</h2></article>',
        'CACHE_BODY_V3'
    )
    for (const html of [
        '<article><script>CACHE_BODY_V3</script></article>',
        '<article><SCRIPT>CACHE_BODY_V3</SCRIPT ></article>',
        '<article><style>CACHE_BODY_V3</style></article>',
        '<script>"<article>CACHE_BODY_V3</article>"</script>',
        '<article>old</article><p>CACHE_BODY_V3</p>',
    ]) {
        assert.throws(() => assertArticleBody(html, 'CACHE_BODY_V3'))
    }
})

test('sitemap locations require exact elements rather than URL substrings', () => {
    const location = 'https://heap-forge.app/ko/docs'
    assertSitemapLocations(
        `<urlset><url><loc>${location}</loc></url></urlset>`,
        [location]
    )
    for (const value of [
        `https://example.com/?next=${location}`,
        `${location}/unrelated`,
        `${location}.example.com`,
    ]) {
        assert.throws(() =>
            assertSitemapLocations(`<loc>${value}</loc>`, [location])
        )
    }
    assert.throws(() =>
        assertSitemapLocations(`<other>${location}</other>`, [location])
    )
    assertSitemapLocations('<loc>https://example.com/?a=1&amp;b=2</loc>', [
        'https://example.com/?a=1&b=2',
    ])
})

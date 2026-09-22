import assert from 'node:assert/strict'
import { decodeXML } from 'entities'
import sanitizeHtml from 'sanitize-html'

export function assertArticleBody(html, marker) {
    // Preserve article boundaries, but never count script/style hydration data.
    const articles = sanitizeHtml(html, {
        allowedTags: ['article'],
        allowedAttributes: {},
    }).matchAll(/<article>([\s\S]*?)<\/article>/g)
    assert.ok(
        [...articles].some((article) => article[1].includes(marker)),
        'Fresh article body must exist in HTML, not only in hydration scripts'
    )
}

export function assertSitemapLocations(xml, expected) {
    const locations = new Set(
        [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) =>
            decodeXML(match[1].trim())
        )
    )
    for (const location of expected) {
        assert.ok(
            locations.has(location),
            `Missing sitemap location: ${location}`
        )
    }
}

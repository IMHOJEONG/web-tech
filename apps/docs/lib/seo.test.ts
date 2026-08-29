import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import {
    getMetadataBase,
    getSiteUrl,
    getStaticSitemapEntries,
    toAbsoluteSiteUrl,
} from './seo.ts'

const originalDocsSiteUrl = process.env.DOCS_SITE_URL
const originalNextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL

afterEach(() => {
    process.env.DOCS_SITE_URL = originalDocsSiteUrl
    process.env.NEXT_PUBLIC_SITE_URL = originalNextPublicSiteUrl
})

test('uses DOCS_SITE_URL as canonical site url', () => {
    process.env.DOCS_SITE_URL = 'https://docs.example.com'

    assert.equal(getSiteUrl().origin, 'https://docs.example.com')
})

test('uses canonical site origin as metadata base', () => {
    process.env.DOCS_SITE_URL = 'https://docs.example.com/nested-path'

    assert.equal(getMetadataBase().toString(), 'https://docs.example.com/')
})

test('falls back to heap-forge.app when site url is invalid', () => {
    process.env.DOCS_SITE_URL = 'not a url'
    delete process.env.NEXT_PUBLIC_SITE_URL

    assert.equal(getSiteUrl().origin, 'https://heap-forge.app')
})

test('builds absolute sitemap urls', () => {
    const siteUrl = new URL('https://docs.example.com')
    const entries = getStaticSitemapEntries(siteUrl)

    assert.equal(entries[0]?.url, 'https://docs.example.com/')
    assert.ok(entries.some((entry) => entry.url.endsWith('/docs')))
    assert.equal(
        toAbsoluteSiteUrl('/docs', siteUrl),
        'https://docs.example.com/docs'
    )
})

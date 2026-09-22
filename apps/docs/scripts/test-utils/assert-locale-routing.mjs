import assert from 'node:assert/strict'
import { assertSitemapLocations } from './assert-content-response.mjs'

export async function assertLocaleRouting(request) {
    const legacy = await request('/docs?q=react&page=2', {
        redirect: 'manual',
        headers: { 'Accept-Language': 'ko-KR' },
    })
    assert.ok([307, 308].includes(legacy.status))
    const target = new URL(legacy.headers.get('location'), 'http://localhost')
    assert.equal(target.pathname, '/ko/docs')
    assert.equal(target.searchParams.get('q'), 'react')
    assert.equal(target.searchParams.get('page'), '2')
    await legacy.text()
    for (const locale of ['ko', 'en', 'ko']) {
        const response = await request(`/${locale}/about`, {
            headers: { Cookie: `NEXT_LOCALE=${locale === 'ko' ? 'en' : 'ko'}` },
        })
        assert.equal(response.status, 200)
        const html = await response.text()
        assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`))
        assert.ok(
            html.includes(
                `rel="canonical" href="https://heap-forge.app/${locale}/about"`
            )
        )
        assert.ok(html.includes(`href="/${locale}/feed"`))
        assert.ok(
            html.includes('hrefLang="ko"') || html.includes('hreflang="ko"')
        )
        assert.ok(
            html.includes('hrefLang="en"') || html.includes('hreflang="en"')
        )
    }
    const sitemap = await request('/sitemap.xml')
    assert.equal(sitemap.status, 200)
    const xml = await sitemap.text()
    assertSitemapLocations(xml, [
        'https://heap-forge.app/ko/docs',
        'https://heap-forge.app/en/docs',
    ])
    const denied = await request('/api/revalidate/content', {
        method: 'POST',
        redirect: 'manual',
    })
    assert.equal(denied.status, 401)
    assert.equal(denied.headers.get('location'), null)
    await denied.text()
    const unknown = await request('/fr/about', { redirect: 'follow' })
    assert.equal(unknown.status, 404)
    await unknown.text()
    console.log(
        '[PASS] Locale URLs, URL-over-cookie priority, legacy query redirect, canonical/hreflang, sitemap, API and 404'
    )
}

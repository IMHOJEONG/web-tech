import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#x27;')
}

export async function assertLocaleBoundary(request, app) {
    const messages = {}
    for (const locale of ['ko', 'en']) {
        messages[locale] = JSON.parse(
            await readFile(join(app, `shared/message/${locale}.json`), 'utf8')
        ).metadata.site
    }
    assert.notEqual(
        messages.ko.description,
        messages.en.description,
        'Locale fixture must distinguish translations'
    )
    async function check(label, expected, headers = {}) {
        const response = await request(`/${expected}/cache-locale-probe`, {
            headers,
        })
        assert.equal(response.status, 200, label)
        const html = await response.text()
        const copy = messages[expected]
        assert.match(
            html,
            new RegExp(`<html[^>]*lang="${expected}"`),
            `${label}: html language`
        )
        assert.ok(
            html.includes(
                `<h1 data-locale-probe="${expected}">${escapeHtml(copy.title)}</h1>`
            ),
            `${label}: rendered copy`
        )
        assert.ok(
            html.includes(`<p>${escapeHtml(copy.description)}</p>`),
            `${label}: rendered description`
        )
        assert.ok(
            html.includes(`<title>${escapeHtml(copy.title)}</title>`),
            `${label}: metadata title`
        )
        assert.ok(
            html.includes(
                `name="description" content="${escapeHtml(copy.description)}"`
            ),
            `${label}: metadata description`
        )
        assert.ok(
            html.includes(
                `property="og:description" content="${escapeHtml(copy.ogDescription)}"`
            ),
            `${label}: OG description`
        )
        console.log('[PASS] Locale boundary', { label, expected })
    }
    await check('header ko', 'ko', { 'Accept-Language': 'ko-KR' })
    await check('header en', 'en', { 'Accept-Language': 'en-US' })
    await check('header ko again', 'ko', { 'Accept-Language': 'ko-KR' })
    await check('URL ko wins over cookie and header en', 'ko', {
        Cookie: 'NEXT_LOCALE=en',
        'Accept-Language': 'en-US',
    })
    await check('URL en wins over cookie and header ko', 'en', {
        Cookie: 'NEXT_LOCALE=ko',
        'Accept-Language': 'ko-KR',
    })
    await check('URL ko ignores unsupported cookie', 'ko', {
        Cookie: 'NEXT_LOCALE=fr',
        'Accept-Language': 'ko-KR',
    })
    await check('URL en ignores unsupported header', 'en', {
        'Accept-Language': 'fr-FR',
    })
    await check('URL en works without preferences', 'en')
    await Promise.all([
        check('concurrent ko', 'ko', { Cookie: 'NEXT_LOCALE=ko' }),
        check('concurrent en', 'en', { Cookie: 'NEXT_LOCALE=en' }),
    ])
}

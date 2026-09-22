import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function assertLocaleCacheKey(request, app, token) {
    const descriptions = {}
    for (const locale of ['ko', 'en']) {
        descriptions[locale] = JSON.parse(
            await readFile(join(app, `shared/message/${locale}.json`), 'utf8')
        ).metadata.site.description
    }
    assert.notEqual(descriptions.ko, descriptions.en)
    async function read(locale) {
        const response = await request(`/${locale}/api/locale-cache-probe`, {
            headers: { Cookie: `NEXT_LOCALE=${locale}` },
        })
        assert.equal(response.status, 200)
        assert.match(response.headers.get('cache-control'), /no-store/)
        const data = await response.json()
        assert.equal(data.locale, locale)
        assert.equal(data.description, descriptions[locale])
        assert.match(data.executionId, /^[0-9a-f-]{36}$/)
        return data
    }
    async function invalidate(locale, authorization) {
        const response = await request('/api/locale-cache-probe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authorization ? { Authorization: authorization } : {}),
            },
            body: JSON.stringify({ locale }),
        })
        await response.json()
        return response.status
    }
    const ko = await read('ko')
    const en = await read('en')
    assert.notEqual(ko.executionId, en.executionId)
    assert.deepEqual(await read('ko'), ko)
    assert.deepEqual(await read('en'), en)
    console.log('[PASS] Locale cache: separate keys and sequential warm reuse')
    const concurrent = await Promise.all([
        read('ko'),
        read('en'),
        read('ko'),
        read('en'),
    ])
    assert.deepEqual(concurrent, [ko, en, ko, en])
    console.log('[PASS] Locale cache: concurrent warm requests remain isolated')
    assert.equal(await invalidate('ko'), 401)
    assert.equal(await invalidate('ko', 'Bearer incorrect'), 401)
    assert.equal(await invalidate('fr', `Bearer ${token}`), 400)
    assert.deepEqual(await read('ko'), ko)
    assert.deepEqual(await read('en'), en)
    console.log(
        '[PASS] Locale cache: rejected invalidation preserves both entries'
    )
    assert.equal(await invalidate('ko', `Bearer ${token}`), 200)
    const koNew = await read('ko')
    assert.notEqual(koNew.executionId, ko.executionId)
    assert.deepEqual(await read('en'), en)
    assert.deepEqual(await read('ko'), koNew)
    assert.equal(await invalidate('en', `Bearer ${token}`), 200)
    const enNew = await read('en')
    assert.notEqual(enNew.executionId, en.executionId)
    assert.deepEqual(await read('ko'), koNew)
    assert.deepEqual(await read('en'), enNew)
    console.log(
        '[PASS] Locale cache: selective ko/en invalidation and renewed warm reuse'
    )
    console.log('[locale-cache-evidence]', {
        koInitial: ko.executionId,
        enInitial: en.executionId,
        koRenewed: koNew.executionId,
        enRenewed: enNew.executionId,
    })
}

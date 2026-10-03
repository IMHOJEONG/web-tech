import assert from 'node:assert/strict'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

function article(version: number, status: string) {
    return `---\ntitle: CACHE_LOCAL_V${version}\nslug: local-index-probe\nsummary: SEARCH_LOCAL_SUMMARY_V${version}\ndate: '2026-10-03'\nstatus: ${status}\n---\n## Test body\n\nLocal search fixture.\n`
}

export async function prepareSearchIndexFixture(app: string) {
    const directory = path.join(app, 'data/v8/search-index-fixture')
    await mkdir(directory, { recursive: true })
    const file = path.join(directory, 'published.md')
    await writeFile(file, article(1, 'published'))
    await writeFile(path.join(directory, 'draft.md'), article(99, 'draft'))
    return file
}

type Options = {
    request: (path: string, options?: RequestInit) => Promise<Response>
    file: string
    token: string
    setOriginUnavailable: (unavailable: boolean) => void
    getOriginCount: () => number
}

export async function assertSearchIndexCache({
    request,
    file,
    token,
    setOriginUnavailable,
    getOriginCount,
}: Options) {
    async function invalidate(authorization?: string) {
        const response = await request('/api/revalidate/content', {
            method: 'POST',
            headers: authorization ? { Authorization: authorization } : {},
        })
        await response.text()
        return response.status
    }
    async function read(query: string, remote = false) {
        const response = await request(
            `/en/api/search-index-probe?q=${encodeURIComponent(query)}&remote=${remote}`
        )
        assert.equal(response.status, 200)
        return (await response.json()) as {
            title: string
            summary: string
            contentSource: string
        }[]
    }
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    const coldStart = performance.now()
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V1')
    const coldMs = performance.now() - coldStart
    await writeFile(file, article(2, 'published'))
    const warmStart = performance.now()
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V1')
    const warmMs = performance.now() - warmStart
    assert.equal(
        (await read('SEARCH_LOCAL_SUMMARY_V1'))[0]?.title,
        'CACHE_LOCAL_V1'
    )
    assert.deepEqual(await read('CACHE_LOCAL_V99'), [])
    for (const authorization of [undefined, 'Bearer invalid-test-token']) {
        assert.equal(await invalidate(authorization), 401)
        assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V1')
    }
    const beforeWebhook = getOriginCount()
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    assert.equal(
        getOriginCount(),
        beforeWebhook,
        'Webhook must not preload origin'
    )
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V2')
    assert.deepEqual(await read('SEARCH_LOCAL_SUMMARY_V1'), [])
    console.log(
        '[PASS] Local index reused across queries; drafts excluded; authorized webhook refreshes V2',
        {
            coldRequestMs: Math.round(coldMs),
            warmRequestMs: Math.round(warmMs),
        }
    )

    await writeFile(file, article(2, 'draft'))
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    assert.deepEqual(await read('SEARCH_LOCAL_SUMMARY_V2'), [])
    await writeFile(file, article(3, 'published'))
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V3')
    await unlink(file)
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V3')
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    assert.deepEqual(await read('SEARCH_LOCAL_SUMMARY_V3'), [])
    console.log(
        '[PASS] Unpublishing and deletion remove cached local results after invalidation'
    )

    await writeFile(file, article(4, 'published'))
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    setOriginUnavailable(true)
    try {
        assert.equal(
            (await read('CACHE_LOCAL', true))[0]?.title,
            'CACHE_LOCAL_V4'
        )
        const requestsAfterFailure = getOriginCount()
        setOriginUnavailable(false)
        const recovered = await read('CACHE_TITLE', true)
        assert.ok(recovered.some((doc) => doc.contentSource === 'remote'))
        assert.ok(
            getOriginCount() > requestsAfterFailure,
            'Remote failure fallback must not be cached as the combined index'
        )
    } finally {
        setOriginUnavailable(false)
    }
    console.log(
        '[PASS] Remote failure keeps local search; recovery fetches remote without another webhook'
    )

    await writeFile(file, '---\ntitle: Invalid\n---\nBody')
    assert.equal(await invalidate(`Bearer ${token}`), 200)
    const invalid = await request('/en/api/search-index-probe?remote=false')
    assert.equal(invalid.status, 500)
    await invalid.text()
    await writeFile(file, article(5, 'published'))
    assert.equal((await read('CACHE_LOCAL'))[0]?.title, 'CACHE_LOCAL_V5')
    console.log('[PASS] Failed local parsing is not stored as an empty index')
}

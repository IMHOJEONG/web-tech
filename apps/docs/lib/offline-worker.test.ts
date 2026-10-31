import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const origin = 'https://heap-forge.app'
const articleCache = 'heap-forge-offline-articles-v1'
type Reply = {
    ok: boolean
    error?: string
    stage?: string
    articles?: { path: string; title: string }[]
}
type WorkerEvent = {
    data?: unknown
    ports?: { postMessage(value: Reply): void }[]
    source?: { id: string }
    request?: { url: string; method: string; mode: string }
    waitUntil(task: Promise<unknown>): void
    respondWith?(response: Promise<Response>): void
}

function worker() {
    const handlers = new Map<string, (event: WorkerEvent) => void>()
    const clients = new Map<
        string,
        { url: string; postMessage(data: unknown, ports: MessagePort[]): void }
    >()
    const stores = new Map<string, Map<string, Response>>()
    let offline = false
    let networkStatus = 200
    let failure: { method: string; name: string } | undefined
    const failIf = (method: string) => {
        if (failure?.method === method)
            throw new DOMException(
                'Private storage exception text',
                failure.name
            )
    }
    const key = (input: string | Request) =>
        new URL(typeof input === 'string' ? input : input.url, origin).href
    const caches = {
        keys: async () => [...stores.keys()],
        delete: async (name: string) => stores.delete(name),
        open: async (name: string) => {
            failIf('open')
            if (!stores.has(name)) stores.set(name, new Map())
            const store = stores.get(name)!
            return {
                keys: async () => {
                    failIf('keys')
                    return [...store.keys()].map((url) => new Request(url))
                },
                match: async (input: string | Request) =>
                    store.get(key(input))?.clone(),
                put: async (input: string | Request, response: Response) => {
                    failIf('put')
                    store.set(key(input), response.clone())
                },
                delete: async (input: string | Request) =>
                    store.delete(key(input)),
                addAll: async (paths: string[]) => {
                    for (const path of paths)
                        store.set(key(path), new Response('offline library'))
                },
            }
        },
    }
    runInNewContext(
        readFileSync(
            new URL('../public/offline-worker.js', import.meta.url),
            'utf8'
        ),
        {
            URL,
            Response,
            TextEncoder,
            MessageChannel,
            setTimeout,
            clearTimeout,
            caches,
            fetch: async () => {
                if (offline) throw new TypeError('offline')
                return new Response('network', { status: networkStatus })
            },
            self: {
                location: { origin },
                addEventListener: (
                    name: string,
                    handler: (event: WorkerEvent) => void
                ) => handlers.set(name, handler),
                skipWaiting: async () => {},
                clients: {
                    get: async (id: string) => clients.get(id),
                    claim: async () => {},
                },
            },
        }
    )
    async function lifecycle(name: string) {
        const tasks: Promise<unknown>[] = []
        handlers.get(name)!({ waitUntil: (task) => tasks.push(task) })
        await Promise.all(tasks)
    }
    async function send(
        action: string,
        path = '/ko/docs/web/test',
        source = origin + path,
        body = '<p>Saved text</p>',
        currentPath?: string
    ) {
        const id = String(clients.size)
        clients.set(id, {
            url: source,
            postMessage(_data, ports) {
                ports[0]!.postMessage({
                    ok: Boolean(
                        currentPath ??
                        (source === origin + path ? path : undefined)
                    ),
                    path:
                        currentPath ??
                        (source === origin + path ? path : undefined),
                })
                ports[0]!.close()
            },
        })
        let reply: Reply | undefined
        const tasks: Promise<unknown>[] = []
        handlers.get('message')!({
            data: {
                channel: 'heap-forge-offline-v1',
                action,
                path,
                snapshot: {
                    path,
                    title: '저장한 글',
                    locale: 'ko',
                    body,
                    missingImages: 0,
                },
            },
            ports: [
                {
                    postMessage: (value) => {
                        reply = value
                    },
                },
            ],
            source: { id },
            waitUntil: (task) => tasks.push(task),
        })
        await Promise.all(tasks)
        return reply!
    }
    function navigate(path: string, mode = 'navigate', method = 'GET') {
        let result: Promise<Response> | undefined
        handlers.get('fetch')!({
            request: { url: key(path), method, mode },
            waitUntil() {},
            respondWith: (response) => {
                result = response
            },
        })
        return result
    }
    return {
        caches,
        lifecycle,
        send,
        navigate,
        disconnect: () => {
            offline = true
        },
        status: (value: number) => {
            networkStatus = value
        },
        fail: (method?: string, name = 'Error') => {
            failure = method ? { method, name } : undefined
        },
    }
}

test('SPA saves verify the current article with the originating client, not its initial Feed URL', async () => {
    const w = worker()
    const path = '/ko/docs/category/be/node-js/node-brotli-runtime-security'
    const source = origin + '/ko/feed'
    assert.equal((await w.send('save', path, source)).ok, false)
    assert.equal((await w.send('save', path, source, undefined, path)).ok, true)
    assert.equal(
        (await w.send('list', path, source, undefined, path)).articles!.length,
        1
    )
    for (const currentPath of [
        '/ko/docs/other',
        '/api/private',
        'https://evil.example/ko/docs/test',
    ]) {
        assert.equal(
            (await w.send('save', path, source, undefined, currentPath)).error,
            'source'
        )
    }
    assert.equal(
        (
            await w.send(
                'save',
                path,
                'https://evil.example/ko/feed',
                undefined,
                path
            )
        ).error,
        'source'
    )
    assert.equal(
        (await w.send('save', path, origin + '/api/private', undefined, path))
            .error,
        'source'
    )
    assert.equal((await w.send('list', path, source)).ok, false)
    assert.equal((await w.send('clear', path, source)).ok, false)
    assert.equal((await w.send('list')).articles!.length, 1)
})

test('storage errors identify quota, denial and operation stage without exposing raw text', async () => {
    const w = worker()
    await w.send('save')
    const cache = await w.caches.open(articleCache)
    const before = await (await cache.match(
        origin + '/ko/docs/web/test'
    ))!.text()
    for (const [method, name, code, stage] of [
        ['put', 'QuotaExceededError', 'storage-quota', 'storage-write'],
        ['open', 'SecurityError', 'storage-denied', 'storage-open'],
        ['keys', 'NotAllowedError', 'storage-denied', 'storage-read'],
        ['put', 'Error', 'storage', 'storage-write'],
    ]) {
        w.fail(method, name)
        const reply = await w.send(method === 'keys' ? 'list' : 'save')
        assert.equal(reply.ok, false)
        assert.equal(reply.error, code)
        assert.equal(reply.stage, stage)
        assert.doesNotMatch(JSON.stringify(reply), /Private storage/)
        w.fail()
        assert.equal(
            await (await cache.match(origin + '/ko/docs/web/test'))!.text(),
            before
        )
    }
})

test('a failed confirmation read is distinguished from a failed write', async () => {
    const w = worker()
    await w.send('save')
    w.fail('keys', 'SecurityError')
    const reply = await w.send(
        'save',
        undefined,
        undefined,
        '<p>Updated copy</p>'
    )
    assert.equal(reply.ok, false)
    assert.equal(reply.error, 'storage-denied')
    assert.equal(reply.stage, 'storage-confirmation')
    w.fail()
    const saved = await (
        await w.caches.open(articleCache)
    ).match(origin + '/ko/docs/web/test')
    assert.match(await saved!.text(), /Updated copy/)
})

test('offline storage requires an explicit matching public-article source and excludes unsafe keys', async () => {
    const w = worker()
    await w.lifecycle('install')
    assert.equal((await w.caches.keys()).includes(articleCache), false)
    for (const path of [
        '/api/private',
        '/ko/preview/test',
        '/ko/docs/test?q=secret',
        '/ko/docs/test#part',
        'https://evil.example/ko/docs/test',
    ]) {
        assert.equal((await w.send('save', path)).ok, false)
    }
    for (const source of [
        origin + '/ko/feed',
        origin + '/ko/preview/test',
        'https://evil.example/ko/docs/test',
        origin + '/ko/docs/web/other',
    ]) {
        assert.equal(
            (await w.send('save', '/ko/docs/web/test', source)).ok,
            false
        )
    }
    assert.equal((await w.send('save')).ok, true)
    const response = await (
        await w.caches.open(articleCache)
    ).match(origin + '/ko/docs/web/test')
    assert.ok(response)
    assert.match(
        response.headers.get('Content-Security-Policy')!,
        /script-src 'none'/
    )
    assert.equal(
        decodeURIComponent(response.headers.get('X-Offline-Title')!),
        '저장한 글'
    )
    assert.equal(
        (await w.send('save', '/ko/docs/web/test', undefined, ' ')).error,
        'snapshot'
    )
    assert.equal(
        (
            await w.send(
                'save',
                '/ko/docs/web/test',
                undefined,
                'x'.repeat(2 * 1024 * 1024)
            )
        ).error,
        'size'
    )
    assert.match(await response.text(), /Saved text/)
    await w.send(
        'save',
        '/ko/docs/web/test',
        undefined,
        '<h1>Original heading</h1><p>Text</p>'
    )
    const withHeading = await (
        await w.caches.open(articleCache)
    ).match(origin + '/ko/docs/web/test')
    assert.equal((await withHeading!.text()).match(/<h1>/g)?.length, 1)
})

test('concurrent explicit saves respect the ten-article cap; updates, deletion and clear remain available', async () => {
    const w = worker()
    const results = await Promise.all(
        Array.from({ length: 11 }, (_, index) =>
            w.send('save', `/ko/docs/test-${index}`)
        )
    )
    assert.equal(results.filter((result) => result.ok).length, 10)
    assert.equal(results[10]!.error, 'limit')
    assert.equal(
        (await w.send('save', '/ko/docs/test-0', undefined, '<p>Updated</p>'))
            .ok,
        true
    )
    assert.equal(
        (await w.send('delete', '/ko/docs/test-0', origin + '/offline.html'))
            .articles!.length,
        9
    )
    assert.equal((await w.send('save', '/ko/docs/test-10')).ok, true)
    assert.equal(
        (await w.send('clear', undefined, origin + '/offline.html')).articles!
            .length,
        0
    )
})

test('worker upgrades preserve saved articles and unrelated application caches', async () => {
    const w = worker()
    await w.send('save')
    await w.caches.open('heap-forge-offline-shell-old')
    await w.caches.open('other-app')
    await w.lifecycle('install')
    await w.lifecycle('activate')
    assert.equal(
        (await w.caches.keys()).includes('heap-forge-offline-shell-old'),
        false
    )
    assert.equal((await w.caches.keys()).includes('other-app'), true)
    assert.equal((await w.send('list')).articles!.length, 1)
})

test('offline navigation serves only saved snapshots or the library, never caches API or RSC responses', async () => {
    const w = worker()
    await w.lifecycle('install')
    await w.send('save')
    assert.equal(w.navigate('/api/private'), undefined)
    assert.equal(w.navigate('/ko/docs/web/test?_rsc=secret', 'cors'), undefined)
    assert.equal(w.navigate('/api/search?q=secret', 'cors'), undefined)
    assert.equal(w.navigate('/ko/docs/web/test', 'navigate', 'POST'), undefined)
    assert.equal(
        await (await w.navigate('/ko/docs/web/test'))!.text(),
        'network'
    )
    w.status(404)
    assert.equal((await w.navigate('/ko/docs/web/test'))!.status, 404)
    w.disconnect()
    assert.match(
        await (await w.navigate('/ko/docs/web/test'))!.text(),
        /Saved text/
    )
    assert.equal(
        await (await w.navigate('/ko/docs/not-saved'))!.text(),
        'offline library'
    )
    assert.equal(
        await (await w.navigate('/ko/feed'))!.text(),
        'offline library'
    )
    assert.equal(
        await (await w.navigate(
            '/offline.html?article=%2Fko%2Fdocs%2Fweb%2Ftest'
        ))!
            .text()
            .then((text) => text.includes('Saved text')),
        true
    )
    assert.equal((await (await w.caches.open(articleCache)).keys()).length, 1)
})

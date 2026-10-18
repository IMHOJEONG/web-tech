import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import ky from 'ky'
import type { Metadata } from './document.types.ts'

test('real content selection and search isolate remote failures from local documents', async (t) => {
    const keys: string[] = [
        'NODE_ENV',
        'BLOG_CONTENT_INCLUDE_REMOTE_INDEX',
        'BLOG_CONTENT_API_BASE_URL_PUBLIC',
        'BLOG_CONTENT_API_BASE_URL_INTERNAL',
        'BLOG_CONTENT_API_BASE_URL',
        'BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC',
        'BLOG_CONTENT_API_TIMEOUT_MS',
        'DOCS_BETTER_STACK_SOURCE_TOKEN',
    ]
    const original = keys.map((key) => [key, process.env[key]] as const)
    t.after(() => {
        for (const [key, value] of original) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })
    Object.assign(process.env, { NODE_ENV: 'development' })
    process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX = 'true'
    process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC =
        'https://content.example.test'
    delete process.env.BLOG_CONTENT_API_BASE_URL_INTERNAL
    delete process.env.BLOG_CONTENT_API_BASE_URL
    delete process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC
    delete process.env.DOCS_BETTER_STACK_SOURCE_TOKEN
    process.env.BLOG_CONTENT_API_TIMEOUT_MS = '100'
    t.mock.method(console, 'warn', () => {})
    t.mock.method(console, 'info', () => {})

    let mode:
        | 'network'
        | 'body-error'
        | 'empty'
        | 'markup-empty'
        | 'stalled'
        | 'bad-json'
        | 'success'
        | 'missing' = 'network'
    let requests: string[] = []
    const fetch: typeof globalThis.fetch = async (input) => {
        const url = new URL((input as Request).url)
        requests.push(url.pathname)
        if (mode === 'network') throw new TypeError('fetch failed')
        if (url.pathname === '/api/posts') {
            if (mode === 'bad-json') return new Response('invalid json')
            return Response.json({
                results:
                    mode === 'missing'
                        ? []
                        : [
                              {
                                  title: 'Remote runtime',
                                  slug: 'javascript-event-loop-runtime',
                                  markdownPath:
                                      'web/javascript-event-loop-runtime',
                                  status: 'published',
                                  date: '2026-10-17',
                              },
                              {
                                  title: 'Remote only',
                                  slug: 'remote-only',
                                  markdownPath: 'web/remote-only',
                                  status: 'published',
                                  date: '2026-10-17',
                              },
                          ],
            })
        }
        if (mode === 'body-error')
            return new Response('Unavailable', { status: 503 })
        if (mode === 'stalled')
            return new Response(new ReadableStream({ start() {} }))
        return new Response(
            mode === 'empty'
                ? '  '
                : mode === 'markup-empty'
                  ? '<article></article>'
                  : '<article><h2>Remote body</h2><p>Working</p></article>',
            { headers: { 'Content-Type': 'text/html' } }
        )
    }
    const require = createRequire(import.meta.url)
    const bundled = await build({
        stdin: {
            contents: `export { getDocsData, getDocByRoutePath } from './lib/get-document'; export { getSearchData } from './lib/get-search-data'`,
            resolveDir: fileURLToPath(new URL('..', import.meta.url)),
            loader: 'ts',
        },
        absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
    })
    const bundledModule = {
        exports: {} as {
            getDocsData(): Promise<Partial<Metadata>[]>
            getDocByRoutePath(path: string): Promise<Partial<Metadata> | null>
            getSearchData(query: string): Promise<{ contentSource: string }[]>
        },
    }
    new Function('require', 'module', 'exports', bundled.outputFiles[0]!.text)(
        (id: string) =>
            id === 'server-only'
                ? {}
                : id === 'ky'
                  ? {
                        get: (url: string, options: object) =>
                            ky.get(url, { ...options, fetch }),
                    }
                  : require(id),
        bundledModule,
        bundledModule.exports
    )
    const api = bundledModule.exports
    await t.test(
        'connection failure keeps both local list and local search usable, without retries',
        async () => {
            requests = []
            assert.ok((await api.getDocsData()).length > 0)
            assert.ok((await api.getSearchData('react')).length > 0)
            assert.equal(requests.length, 2)
        }
    )
    for (const failure of [
        'body-error',
        'empty',
        'markup-empty',
        'stalled',
        'bad-json',
    ] as const) {
        await t.test(
            `${failure}: local detail replaces unusable remote body`,
            async () => {
                mode = failure
                const doc = await api.getDocByRoutePath(
                    'web/javascript-event-loop-runtime'
                )
                assert.ok(doc)
                assert.ok(doc.content?.trim())
                assert.equal(doc.contentSource, 'local')
            }
        )
    }
    await t.test(
        'known remote body failure without a local copy is an error, not a fake 404',
        async () => {
            mode = 'body-error'
            await assert.rejects(api.getDocByRoutePath('web/remote-only'))
        }
    )
    await t.test('a genuinely absent route still returns null', async () => {
        mode = 'missing'
        assert.equal(await api.getDocByRoutePath('web/not-listed'), null)
    })
    await t.test('healthy remote detail remains preferred', async () => {
        mode = 'success'
        const doc = await api.getDocByRoutePath(
            'web/javascript-event-loop-runtime'
        )
        assert.equal(doc?.contentSource, 'remote')
        assert.match(doc.content!, /Remote body/)
    })
})

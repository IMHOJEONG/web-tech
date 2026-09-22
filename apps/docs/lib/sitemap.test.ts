import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { build } from 'esbuild'
import { VFile } from 'vfile'
import { matter } from 'vfile-matter'
import type { MetadataRoute } from 'next'

test('sitemap uses the public content pipeline', async (t) => {
    // Bundle aliases for Node; mock only HTTP and the server-only marker so
    // normalization, publication filtering and local MDX loading stay real.
    const result = await build({
        entryPoints: [
            fileURLToPath(new URL('../app/sitemap.ts', import.meta.url)),
        ],
        absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
    })
    const require = createRequire(import.meta.url)
    let payload: unknown = []
    let failure = false
    let requests = 0
    const compiledModule = {
        exports: {} as {
            default: () => Promise<MetadataRoute.Sitemap>
            revalidate: number
        },
    }
    const mockRequire = (id: string) => {
        if (id === 'server-only') return {}
        if (id === 'ky')
            return {
                get: async () => {
                    requests++
                    if (failure) throw new Error('Upstream unavailable')
                    return { ok: true, json: async () => payload }
                },
            }
        return require(id)
    }
    new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
        mockRequire,
        compiledModule,
        compiledModule.exports
    )
    const sitemap = compiledModule.exports.default
    const environmentKeys = [
        'DOCS_SITE_URL',
        'BLOG_CONTENT_INCLUDE_REMOTE_INDEX',
        'BLOG_CONTENT_API_BASE_URL_PUBLIC',
        'BLOG_CONTENT_API_BASE_URL_INTERNAL',
        'BLOG_CONTENT_API_BASE_URL',
    ] as const
    const originalEnvironment = Object.fromEntries(
        environmentKeys.map((key) => [key, process.env[key]])
    )
    t.after(() => {
        for (const key of environmentKeys) {
            const value = originalEnvironment[key]
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })
    t.mock.method(console, 'info', () => {})
    t.mock.method(console, 'warn', () => {})
    process.env.DOCS_SITE_URL = 'https://docs.example.com'
    process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC = 'https://content.example.com'
    delete process.env.BLOG_CONTENT_API_BASE_URL_INTERNAL
    delete process.env.BLOG_CONTENT_API_BASE_URL
    delete process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX

    await t.test(
        'includes remote articles, modified dates and locale alternates',
        async () => {
            payload = [
                {
                    title: 'Remote only',
                    slug: 'remote-only',
                    markdownPath: 'web/remote-only',
                    date: '2026-09-01',
                    updatedAt: '2026-09-18',
                    status: 'published',
                },
                {
                    title: 'Draft',
                    slug: 'draft-only',
                    markdownPath: 'web/draft-only',
                    status: 'draft',
                },
                {
                    title: 'Archived',
                    slug: 'archived-only',
                    markdownPath: 'web/archived-only',
                    status: 'archived',
                },
            ]
            const entries = await sitemap()
            const article = entries.find((entry) =>
                entry.url.endsWith('/ko/docs/web/remote-only')
            )
            assert.ok(article)
            assert.equal(
                (article.lastModified as Date).toISOString(),
                '2026-09-18T00:00:00.000Z'
            )
            assert.deepEqual(article.alternates?.languages, {
                ko: 'https://docs.example.com/ko/docs/web/remote-only',
                en: 'https://docs.example.com/en/docs/web/remote-only',
            })
            assert.ok(
                entries.some((entry) =>
                    entry.url.endsWith('/en/docs/web/remote-only')
                )
            )
            assert.ok(
                !entries.some((entry) =>
                    /draft-only|archived-only/.test(entry.url)
                )
            )
            const local = entries.find((entry) =>
                entry.url.endsWith('/ko/docs/html-in-canvas-paint-record')
            )
            assert.ok(local)
            const source = new VFile(
                readFileSync(
                    new URL('../data/canvas/readme.md', import.meta.url),
                    'utf8'
                )
            )
            matter(source)
            const localMetadata = source.data.matter as {
                updatedAt?: string
                date: string
            }
            assert.equal(
                (local.lastModified as Date).toISOString(),
                new Date(
                    localMetadata.updatedAt ?? localMetadata.date
                ).toISOString()
            )
        }
    )

    await t.test(
        'deduplicates local and remote routes using remote metadata',
        async () => {
            payload = [
                {
                    title: 'Runtime update',
                    slug: 'javascript-event-loop-runtime',
                    markdownPath: 'web/javascript-event-loop-runtime',
                    date: '2026-09-17',
                    status: 'published',
                },
            ]
            const entries = await sitemap()
            const articles = entries.filter((entry) =>
                entry.url.endsWith('/docs/web/javascript-event-loop-runtime')
            )
            assert.equal(articles.length, 2)
            assert.equal(
                new Set(entries.map((entry) => entry.url)).size,
                entries.length
            )
            assert.ok(
                articles.every(
                    (entry) =>
                        (entry.lastModified as Date).toISOString() ===
                        '2026-09-17T00:00:00.000Z'
                )
            )
        }
    )

    await t.test(
        'keeps local and static URLs available on upstream failure',
        async () => {
            failure = true
            const entries = await sitemap()
            assert.ok(
                entries.some(
                    (entry) => entry.url === 'https://docs.example.com/ko'
                )
            )
            assert.ok(entries.some((entry) => entry.url.includes('/docs/')))
            assert.ok(
                !entries.some((entry) => entry.url.endsWith('/remote-only'))
            )
            assert.equal(compiledModule.exports.revalidate, 300)
            failure = false
        }
    )

    await t.test(
        'does not call the upstream when remote indexing is disabled',
        async () => {
            process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX = 'false'
            const before = requests
            assert.ok(
                (await sitemap()).some((entry) => entry.url.includes('/docs/'))
            )
            assert.equal(requests, before)
        }
    )

    await t.test('works without a configured remote API', async () => {
        delete process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX
        delete process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC
        const before = requests
        assert.ok(
            (await sitemap()).some((entry) => entry.url.includes('/docs/'))
        )
        assert.equal(requests, before)
    })
})

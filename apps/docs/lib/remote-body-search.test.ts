import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import ky from 'ky'
import { CONTENT_POSTS_MAX_BYTES } from '@web-tech/docs-content-contract'
import { loadLocalSearchIndex } from './local-search-index.ts'
import type { SearchData } from './get-search-data'
import type { Metadata } from './document.types.ts'
import { buildSearchResultItems } from './search-result-contract.ts'

test('local and remote body search share source selection, ranking and failure boundaries', async (t) => {
    const env = {
        NODE_ENV: 'test',
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
        BLOG_CONTENT_API_BASE_URL_PUBLIC: 'https://content.example.test',
        BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
        BLOG_CONTENT_API_BASE_URL: '',
        BLOG_CONTENT_API_TOKEN: 'fixture-search-token',
        DOCS_BETTER_STACK_SOURCE_TOKEN: '',
    }
    const previous = Object.keys(env).map(
        (key) => [key, process.env[key]] as const
    )
    Object.assign(process.env, env)
    t.after(() => {
        for (const [key, value] of previous) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
    })
    t.mock.method(console, 'info', () => {})
    t.mock.method(console, 'warn', () => {})
    const temporary = await mkdtemp(path.join(tmpdir(), 'body-search-'))
    t.after(() => rm(temporary, { force: true, recursive: true }))
    await mkdir(path.join(temporary, 'data/v8'), { recursive: true })
    for (const [slug, status, content] of [
        ['shared', 'published', 'localbodyneedle bothneedle'],
        ['local-only', 'published', 'localonlyneedle'],
        ['local-draft', 'draft', 'localdraftneedle'],
        ['local-archived', 'archived', 'localarchivedneedle'],
    ]) {
        await writeFile(
            path.join(temporary, `data/v8/${slug}.md`),
            `---\ntitle: Local notebook\nslug: ${slug}\nsummary: Overview\ndate: '2026-10-26'\nstatus: ${status}\n---\n## Details\n${content}\n`
        )
    }
    const local = await loadLocalSearchIndex(temporary)
    let remote: Record<string, unknown>[] = [
        {
            title: 'Remote notebook',
            summary: 'Overview',
            slug: 'shared',
            markdownPath: 'web/shared',
            status: 'published',
            date: '2026-10-26',
            searchText: 'remotebodyneedle bothneedle <img onerror=needle()>',
            content: '<article>legacybodyneedle</article>',
        },
        {
            title: 'Hidden draft',
            slug: 'draft',
            markdownPath: 'web/draft',
            status: 'draft',
            searchText: 'remotedraftneedle',
        },
        {
            title: 'Hidden archived',
            slug: 'archived',
            markdownPath: 'web/archived',
            status: 'archived',
            searchText: 'remotearchivedneedle',
        },
    ]
    let failure = false
    let oversized = false
    const requests: string[] = []
    const fetch: typeof globalThis.fetch = async (input) => {
        const url = new URL((input as Request).url)
        requests.push(url.pathname)
        assert.equal(
            url.pathname,
            '/api/posts',
            'search must never fan out to body endpoints'
        )
        if (failure) throw new TypeError('fixture network failure')
        if (oversized)
            return Response.json({
                results: [
                    {
                        ...remote[0],
                        searchText: 'x'.repeat(CONTENT_POSTS_MAX_BYTES),
                    },
                ],
            })
        return Response.json({ results: remote })
    }
    const root = fileURLToPath(new URL('..', import.meta.url))
    const bundle = await build({
        stdin: {
            contents: `export { getSearchData } from './lib/get-search-data';
                export { fetchRemoteSearchData, fetchRemoteDocsData } from './lib/content-api';`,
            loader: 'ts',
            resolveDir: root,
        },
        absWorkingDir: root,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
        plugins: [
            {
                name: 'body-search-fixture',
                setup(builder) {
                    builder.onResolve(
                        { filter: /local-search-cache$/ },
                        () => ({
                            path: 'body-search-local-index',
                            external: true,
                        })
                    )
                },
            },
        ],
    })
    type Api = {
        getSearchData(
            query?: string,
            options?: { includeRemote?: boolean }
        ): Promise<SearchData[]>
        fetchRemoteSearchData(query?: string): Promise<SearchData[]>
        fetchRemoteDocsData(): Promise<Partial<Metadata>[]>
    }
    const bundledModule = { exports: {} as Api }
    const require = createRequire(import.meta.url)
    new Function('require', 'module', 'exports', bundle.outputFiles[0]!.text)(
        (id: string) => {
            if (id === 'server-only') return {}
            if (id === 'body-search-local-index')
                return { getLocalSearchIndex: async () => local }
            if (id === 'ky')
                return {
                    get: (url: string, options: object) =>
                        ky.get(url, { ...options, fetch }),
                }
            return require(id)
        },
        bundledModule,
        bundledModule.exports
    )
    const api = bundledModule.exports
    const search = async (query: string) => {
        const start = requests.length
        const results = await api.getSearchData(query)
        assert.equal(
            requests.length - start,
            1,
            'one list request, no retries or detail fetch'
        )
        return results
    }

    await t.test(
        'local body works independently of the remote index',
        async () => {
            const start = requests.length
            const results = await api.getSearchData('localbodyneedle', {
                includeRemote: false,
            })
            assert.equal(results.length, 1)
            assert.equal(results[0]?.contentSource, 'local')
            assert.equal(requests.length, start)
        }
    )
    await t.test(
        'body-only remote match appears once at the canonical route',
        async () => {
            const results = await search('remotebodyneedle')
            assert.equal(results.length, 1)
            assert.equal(results[0]?.href, '/docs/web/shared')
            assert.equal(results[0]?.contentSource, 'remote')
            assert.match(results[0]!.content, /remotebodyneedle/)
            assert.equal((await search('bothneedle')).length, 1)
            assert.equal((await search('localbodyneedle')).length, 0)
            assert.equal((await search('localonlyneedle')).length, 1)
        }
    )
    await t.test(
        'search text never becomes an article body, and previews escape it',
        async () => {
            const docs = await api.fetchRemoteDocsData()
            assert.equal(docs[0]?.content, '')
            assert.match(docs[0]?.searchText ?? '', /remotebodyneedle/)
            const result = (await search('remotebodyneedle'))[0]!
            const preview = buildSearchResultItems([result], 'needle')[0]!
                .preview.excerptHtml
            assert.doesNotMatch(preview, /<img\b/)
            assert.equal((await search('legacybodyneedle')).length, 0)
            const adapterResults = await api.fetchRemoteSearchData()
            assert.match(adapterResults[0]?.content ?? '', /remotebodyneedle/)
            const bodyMatches =
                await api.fetchRemoteSearchData('remotebodyneedle')
            assert.equal(bodyMatches.length, 1)
            assert.equal(bodyMatches[0]?.href, '/docs/web/shared')
            assert.equal(
                (await api.fetchRemoteSearchData('legacybodyneedle')).length,
                0
            )
        }
    )
    await t.test(
        'drafts and archived bodies are excluded from both sources',
        async () => {
            for (const query of [
                'localdraftneedle',
                'localarchivedneedle',
                'remotedraftneedle',
                'remotearchivedneedle',
            ]) {
                assert.deepEqual(await search(query), [])
            }
        }
    )
    await t.test(
        'fresh list data replaces an old body without mixing local text',
        async () => {
            remote[0] = { ...remote[0], searchText: 'updatedbodyneedle' }
            assert.equal((await search('remotebodyneedle')).length, 0)
            assert.equal((await search('updatedbodyneedle')).length, 1)
            assert.equal((await search('localbodyneedle')).length, 0)
        }
    )
    await t.test(
        'older producers without searchText retain metadata-only search',
        async () => {
            delete remote[0]!.searchText
            assert.equal((await search('updatedbodyneedle')).length, 0)
            assert.equal((await search('localbodyneedle')).length, 0)
            assert.equal((await search('legacybodyneedle')).length, 0)
            assert.equal((await search('Remote notebook')).length, 1)
            remote[0]!.searchText = ''
            assert.equal((await search('localbodyneedle')).length, 0)
            remote[0]!.searchText = null
            assert.equal((await search('localbodyneedle')).length, 0)
        }
    )
    await t.test(
        'network and invalid search payload failures fall back to local body search',
        async () => {
            failure = true
            assert.equal(
                (await search('localbodyneedle'))[0]?.contentSource,
                'local'
            )
            failure = false
            remote[0]!.searchText = 42
            assert.equal(
                (await search('localbodyneedle'))[0]?.contentSource,
                'local'
            )
        }
    )
    await t.test(
        'oversized list fails as a whole and keeps local body search without fan-out or retry',
        async () => {
            oversized = true
            try {
                assert.equal(
                    (await search('localbodyneedle'))[0]?.contentSource,
                    'local'
                )
                await assert.rejects(api.fetchRemoteDocsData())
            } finally {
                oversized = false
            }
        }
    )
    await t.test(
        'remote title and summary matches still outrank a body-only match',
        async () => {
            remote = [
                {
                    slug: 'body-match',
                    title: 'Body match',
                    summary: 'Overview',
                    searchText: 'rankneedle',
                },
                {
                    slug: 'summary-match',
                    title: 'Summary match',
                    summary: 'rankneedle',
                    searchText: 'Other body',
                },
                {
                    slug: 'title-match',
                    title: 'rankneedle',
                    summary: 'Overview',
                    searchText: 'Other body',
                },
            ].map((post) => ({
                ...post,
                markdownPath: `web/${post.slug}`,
                status: 'published',
            }))
            const results = await search('rankneedle')
            assert.deepEqual(
                results.map((doc) => doc.slug),
                ['title-match', 'summary-match', 'body-match']
            )
        }
    )
})

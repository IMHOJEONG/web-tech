import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import ky from 'ky'
import type { SearchData } from './get-search-data'
import { filterDocsIndexControls } from '../widgets/docs-index/model/docs-index-controls.ts'
import { getDocsIndexSectionSummary } from '../widgets/docs-index/model/docs-index-summary.ts'

test('remote canonical taxonomy reaches search, filters and hubs without losing source precedence', async (t) => {
    const env = {
        NODE_ENV: 'test',
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
        BLOG_CONTENT_API_BASE_URL_PUBLIC: 'https://content.example.test',
        BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
        BLOG_CONTENT_API_BASE_URL: '',
        BLOG_CONTENT_API_TOKEN: 'fixture-only',
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

    const local: SearchData = {
        id: 'local-shared',
        title: 'Local shared',
        slug: 'shared',
        summary: 'Local summary',
        content: 'Local body',
        fileName: 'data/v8/shared',
        href: '/docs/web/shared',
        section: 'Web',
        contentSource: 'local',
    }
    const results = [
        {
            slug: 'browser',
            markdownPath: 'web/browser',
            fileName: 'remote/browser',
        },
        {
            slug: 'dialog',
            markdownPath: 'ui-ux/dialog',
            fileName: 'remote/dialog',
        },
        {
            slug: 'touch',
            markdownPath: 'mobile/touch',
            fileName: 'remote/touch',
        },
        {
            slug: 'shared',
            markdownPath: 'web/shared',
            fileName: 'remote/shared',
        },
    ].map((doc) => ({
        ...doc,
        title: `Remote ${doc.slug}`,
        status: 'published',
    }))
    const requestPaths: string[] = []
    const fetch: typeof globalThis.fetch = async (input) => {
        requestPaths.push(new URL((input as Request).url).pathname)
        return Response.json({
            results: [
                ...results,
                {
                    slug: 'draft',
                    markdownPath: 'mobile/draft',
                    title: 'Hidden draft',
                    status: 'draft',
                },
            ],
        })
    }
    const root = fileURLToPath(new URL('..', import.meta.url))
    const bundled = await build({
        stdin: {
            contents: `export { getSearchData } from './lib/get-search-data';
                export { fetchRemoteSearchData } from './lib/content-api';
                export { getFeedArticles } from './widgets/m/model/feed-document';
                export { getChannelHubDocs } from './widgets/content-hub/model/get-channel-hub-docs';`,
            resolveDir: root,
            loader: 'ts',
        },
        absWorkingDir: root,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
        plugins: [
            {
                name: 'local-taxonomy-fixture',
                setup(builder) {
                    builder.onResolve(
                        { filter: /(?:local-search-cache|get-category)$/ },
                        (args) => ({
                            path: args.path.endsWith('get-category')
                                ? 'taxonomy-test-local-category'
                                : 'taxonomy-test-local-index',
                            external: true,
                        })
                    )
                },
            },
        ],
    })
    type Api = {
        getSearchData(): Promise<SearchData[]>
        fetchRemoteSearchData(): Promise<SearchData[]>
        getChannelHubDocs(
            channel: 'web' | 'uiux' | 'mobile'
        ): Promise<SearchData[]>
        getFeedArticles(
            docs: object[],
            filter: 'web' | 'uiux' | 'mobile'
        ): { topic: string; href: string }[]
    }
    const bundledModule = { exports: {} as Api }
    const require = createRequire(import.meta.url)
    new Function('require', 'module', 'exports', bundled.outputFiles[0]!.text)(
        (id: string) => {
            if (id === 'server-only') return {}
            if (id === 'taxonomy-test-local-index') {
                return { getLocalSearchIndex: async () => [local] }
            }
            if (id === 'taxonomy-test-local-category') {
                return { getSubCategoryData: async () => [local] }
            }
            if (id === 'ky') {
                return {
                    get: (url: string, options: object) =>
                        ky.get(url, { ...options, fetch }),
                }
            }
            return require(id)
        },
        bundledModule,
        bundledModule.exports
    )
    const api = bundledModule.exports
    const docs = await api.getSearchData()

    await t.test(
        'index keeps canonical labels and only the remote copy of duplicate routes',
        () => {
            assert.deepEqual(
                docs.map((doc) => [doc.slug, doc.section]),
                [
                    ['browser', 'Web'],
                    ['dialog', 'UI/UX'],
                    ['touch', 'Mobile'],
                    ['shared', 'Web'],
                ]
            )
            assert.equal(
                docs.find((doc) => doc.slug === 'shared')?.contentSource,
                'remote'
            )
            assert.equal(
                docs.some((doc) => doc.slug === 'draft'),
                false
            )
            assert.deepEqual(
                getDocsIndexSectionSummary(docs).map((item) => item.key),
                ['Web', 'Mobile', 'UI/UX']
            )
        }
    )
    await t.test(
        'Web, UI/UX and Mobile section filters do not lose canonical remote documents',
        () => {
            for (const [section, slugs] of [
                ['web', ['browser', 'shared']],
                ['uiux', ['dialog']],
                ['mobile', ['touch']],
            ] as const) {
                assert.deepEqual(
                    filterDocsIndexControls(docs, {
                        section,
                        sort: 'latest',
                    }).map((doc) => doc.slug),
                    slugs
                )
            }
        }
    )
    await t.test(
        'both remote search entry points use the same section mapping',
        async () => {
            assert.deepEqual(
                (await api.fetchRemoteSearchData()).map((doc) => doc.section),
                docs.map((doc) => doc.section)
            )
        }
    )
    await t.test(
        'feed filters and fallback topic labels honor canonical metadata',
        () => {
            for (const [channel, prefix, topic] of [
                ['web', 'web', 'WEB'],
                ['uiux', 'ui-ux', 'UI/UX'],
                ['mobile', 'mobile', 'MOBILE'],
            ] as const) {
                const articles = api.getFeedArticles(results, channel)
                assert.ok(articles.length > 0)
                assert.ok(
                    articles.every(
                        (article) =>
                            article.topic === topic &&
                            article.href.startsWith(`/docs/${prefix}/`)
                    )
                )
            }
            assert.equal(
                api.getFeedArticles(
                    [{ ...results[0], topicLabel: 'EXPLICIT TOPIC' }],
                    'web'
                )[0]?.topic,
                'EXPLICIT TOPIC'
            )
        }
    )
    await t.test(
        'hub filtering preserves the selected remote document rather than reloading a local duplicate',
        async () => {
            const web = await api.getChannelHubDocs('web')
            assert.deepEqual(
                web.map((doc) => doc.slug),
                ['browser', 'shared']
            )
            assert.equal(
                web.find((doc) => doc.slug === 'shared')?.title,
                'Remote shared'
            )
            assert.deepEqual(
                (await api.getChannelHubDocs('uiux')).map((doc) => doc.slug),
                ['dialog']
            )
            assert.deepEqual(
                (await api.getChannelHubDocs('mobile')).map((doc) => doc.slug),
                ['touch']
            )
        }
    )
    assert.ok(requestPaths.every((path) => path === '/api/posts'))
})

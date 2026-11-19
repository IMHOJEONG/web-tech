import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import {
    getContentDeliveryMode,
    getPrivateContentRevision,
} from './content-delivery-mode.ts'

test('delivery mode is explicit and a Git runtime requires a full revision', () => {
    assert.equal(getContentDeliveryMode({}), 'legacy')
    assert.equal(getPrivateContentRevision({}), undefined)
    assert.throws(() => getContentDeliveryMode({ DOCS_CONTENT_SOURCE: 'typo' }))
    assert.throws(() =>
        getPrivateContentRevision({ DOCS_CONTENT_SOURCE: 'private-git' })
    )
    assert.equal(
        getPrivateContentRevision({
            DOCS_CONTENT_SOURCE: 'private-git',
            DOCS_PRIVATE_CONTENT_REVISION: 'a'.repeat(40),
        }),
        'a'.repeat(40)
    )
})

test('build-time mode and revision remain usable without runtime environment values', async () => {
    const bundle = await build({
        entryPoints: [
            fileURLToPath(
                new URL('./content-delivery-mode.ts', import.meta.url)
            ),
        ],
        bundle: true,
        platform: 'node',
        format: 'cjs',
        write: false,
        define: {
            'process.env.DOCS_CONTENT_SOURCE': JSON.stringify('private-git'),
            'process.env.DOCS_PRIVATE_CONTENT_REVISION': JSON.stringify(
                'a'.repeat(40)
            ),
        },
    })
    const bundledModule = {
        exports: {} as {
            getContentDeliveryMode(): string
            getPrivateContentRevision(): string
        },
    }
    new Function('module', 'exports', bundle.outputFiles[0]!.text)(
        bundledModule,
        bundledModule.exports
    )
    assert.equal(bundledModule.exports.getContentDeliveryMode(), 'private-git')
    assert.equal(
        bundledModule.exports.getPrivateContentRevision(),
        'a'.repeat(40)
    )
})

test('Git mode blocks NAS for index, explicit remote inclusion, detail misses and search', async (t) => {
    const env = {
        DOCS_CONTENT_SOURCE: 'private-git',
        DOCS_PRIVATE_CONTENT_REVISION: 'a'.repeat(40),
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
        BLOG_CONTENT_API_BASE_URL: 'https://content.example.test',
    }
    for (const [key, value] of Object.entries(env)) {
        const previous = process.env[key]
        process.env[key] = value
        t.after(() => {
            if (previous === undefined) delete process.env[key]
            else process.env[key] = previous
        })
    }
    const temporary = fs.mkdtempSync(
        path.join(os.tmpdir(), 'git-runtime-test-')
    )
    const previous = process.cwd()
    t.after(() => {
        process.chdir(previous)
        fs.rmSync(temporary, { recursive: true, force: true })
    })
    fs.mkdirSync(
        path.join(
            temporary,
            '.generated-content',
            env.DOCS_PRIVATE_CONTENT_REVISION,
            'data'
        ),
        { recursive: true }
    )
    fs.mkdirSync(
        path.join(
            temporary,
            '.generated-content',
            env.DOCS_PRIVATE_CONTENT_REVISION,
            'category'
        )
    )
    process.chdir(temporary)
    t.mock.method(console, 'info', () => {})
    const blockedFetch = t.mock.method(globalThis, 'fetch', () => {
        throw new Error('NAS request must not occur')
    })
    const appRoot = fileURLToPath(new URL('..', import.meta.url))
    const bundled = await build({
        stdin: {
            contents: `export * from './lib/get-document'; export * from './lib/content-api-config'; export { fetchRemoteDocsData, fetchRemoteSearchData, fetchRemoteDocByRoutePath } from './lib/content-api';`,
            loader: 'ts',
            resolveDir: appRoot,
        },
        absWorkingDir: appRoot,
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'cjs',
        write: false,
    })
    const require = createRequire(import.meta.url)
    const bundledModule = {
        exports: {} as {
            getContentApiConfig(): null
            shouldIncludeRemoteContentIndex(): boolean
            getDocsData(options?: {
                includeRemote: boolean
            }): Promise<unknown[]>
            getDocByRoutePath(route: string): Promise<unknown>
            fetchRemoteDocsData(): Promise<unknown[] | null>
            fetchRemoteSearchData(query: string): Promise<unknown[] | null>
            fetchRemoteDocByRoutePath(route: string): Promise<unknown>
        },
    }
    new Function('require', 'module', 'exports', bundled.outputFiles[0]!.text)(
        (name: string) => (name === 'server-only' ? {} : require(name)),
        bundledModule,
        bundledModule.exports
    )
    const api = bundledModule.exports
    assert.equal(api.getContentApiConfig(), null)
    assert.equal(api.shouldIncludeRemoteContentIndex(), false)
    assert.deepEqual(await api.getDocsData(), [])
    assert.deepEqual(await api.getDocsData({ includeRemote: true }), [])
    assert.equal(await api.getDocByRoutePath('feed/pna'), null)
    assert.equal(await api.fetchRemoteDocByRoutePath('feed/pna'), null)
    assert.equal((await api.fetchRemoteDocsData())?.length ?? 0, 0)
    assert.equal((await api.fetchRemoteSearchData('needle'))?.length ?? 0, 0)
    assert.equal(blockedFetch.mock.callCount(), 0)
})

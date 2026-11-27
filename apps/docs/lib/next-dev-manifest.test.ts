import assert from 'node:assert/strict'
import fs from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { TestContext } from 'node:test'

const require = createRequire(import.meta.url)
const { default: DevServer } =
    require('next/dist/server/dev/next-dev-server.js') as typeof import('next/dist/server/dev/next-dev-server.js')
const { loadManifest } =
    require('next/dist/server/load-manifest.external.js') as typeof import('next/dist/server/load-manifest.external.js')
const { FallbackMode } = require('next/dist/lib/fallback.js') as {
    FallbackMode: { BLOCKING_STATIC_RENDER: string }
}

let fixtureSequence = 0

function deferred() {
    let resolve = () => {}
    const promise = new Promise<void>((done) => {
        resolve = done
    })
    return { promise, resolve }
}

async function withManifest(
    t: TestContext,
    run: (fixture: {
        path: string
        update: (route: string) => Promise<unknown>
        cache: Map<string, unknown>
        onCleanup: (release: () => void) => void
    }) => Promise<void>
) {
    const directory = await mkdtemp(join(tmpdir(), 'docs-manifest-regression-'))
    const path = join(directory, 'prerender-manifest.json')
    const cache = new Map<string, unknown>()
    const pending: Promise<unknown>[] = []
    const releases: (() => void)[] = []
    const prefix = `/manifest-fixture-${++fixtureSequence}`
    fs.writeFileSync(
        path,
        JSON.stringify(
            {
                version: 4,
                routes: {},
                dynamicRoutes: {},
                notFoundRoutes: [],
                preview: {},
            },
            null,
            2
        )
    )
    const context = {
        dir: directory,
        distDir: directory,
        buildId: 'synthetic',
        nextConfig: { experimental: {}, cacheComponents: false },
        staticPathsCache: {
            get: (key: string) => cache.get(key),
            set: (key: string, value: unknown) => cache.set(key, value),
            remove: (key: string) => cache.delete(key),
        },
        getStaticPathsWorker: () => ({
            loadStaticPaths: async ({ pathname }: { pathname: string }) => ({
                prerenderedRoutes: [
                    { pathname: pathname.replace('[locale]', 'ko') },
                ],
                fallbackMode: FallbackMode.BLOCKING_STATIC_RENDER,
            }),
            end: () => {},
        }),
    }
    const update = (route: string) => {
        const pathname = `${prefix}/[locale]/${route}`
        // Invoke the installed implementation, not a copy of its read/write logic.
        const pendingUpdate = Reflect.apply(
            Reflect.get(DevServer.prototype, 'getStaticPaths'),
            context,
            [
                {
                    pathname,
                    page: pathname,
                    urlPathname: pathname.replace('[locale]', 'ko'),
                    requestHeaders: {},
                    isAppPath: true,
                },
            ]
        ) as Promise<unknown>
        pending.push(pendingUpdate)
        void pendingUpdate.catch(() => {})
        return pendingUpdate
    }
    try {
        await run({
            path,
            update,
            cache,
            onCleanup: (release) => releases.push(release),
        })
    } finally {
        for (const release of releases) release()
        await Promise.allSettled(pending)
        t.mock.restoreAll()
        await rm(directory, { recursive: true, force: true })
    }
}

test('dev manifest readers never observe the truncate window', async (t) => {
    await withManifest(t, async ({ path, update, onCleanup }) => {
        const truncated = deferred()
        const releaseWrite = deferred()
        onCleanup(releaseWrite.resolve)
        const originalWrite = fs.promises.writeFile
        t.mock.method(
            fs.promises,
            'writeFile',
            async (...args: Parameters<typeof originalWrite>) => {
                if (args[0] === path) {
                    await originalWrite(path, '')
                    truncated.resolve()
                    await releaseWrite.promise
                }
                return originalWrite(...args)
            }
        )
        const pending = update('ui-ux')
        await Promise.race([truncated.promise, pending])
        // In dev the route module deliberately reads without manifest caching.
        const manifest = loadManifest<{ routes: Record<string, unknown> }>(
            path,
            false
        )
        assert.equal(Object.keys(manifest.routes).length, 1)
        releaseWrite.resolve()
        await pending
    })
})

test('parallel static paths updates preserve both routes', async (t) => {
    await withManifest(t, async ({ path, update, onCleanup }) => {
        const readBarrier = deferred()
        onCleanup(readBarrier.resolve)
        const originalRead = fs.promises.readFile
        let readers = 0
        t.mock.method(
            fs.promises,
            'readFile',
            async (...args: Parameters<typeof originalRead>) => {
                const result = await originalRead(...args)
                if (args[0] === path) {
                    if (++readers === 2) readBarrier.resolve()
                    await readBarrier.promise
                }
                return result
            }
        )
        await Promise.all([update('ui-ux'), update('web')])
        const manifest = loadManifest<{
            routes: Record<string, unknown>
            dynamicRoutes: Record<string, unknown>
        }>(path, false)
        assert.equal(Object.keys(manifest.routes).length, 2)
        assert.equal(Object.keys(manifest.dynamicRoutes).length, 2)
        assert.ok(
            Object.keys(manifest.routes).some((route) =>
                route.endsWith('/ui-ux')
            )
        )
        assert.ok(
            Object.keys(manifest.routes).some((route) => route.endsWith('/web'))
        )
    })
})

test('invalid initial manifest still rejects and clears the paths cache', async (t) => {
    await withManifest(t, async ({ path, update, cache }) => {
        fs.writeFileSync(path, '{')
        await assert.rejects(update('invalid'), SyntaxError)
        assert.equal(cache.size, 0)
        assert.equal(fs.readFileSync(path, 'utf8'), '{')
    })
})

test('manifest write errors are not swallowed or cached as success', async (t) => {
    await withManifest(t, async ({ path, update, cache }) => {
        const failure = new Error('Synthetic manifest write failure')
        const originalSyncWrite = fs.writeFileSync
        const originalWrite = fs.promises.writeFile
        t.mock.method(
            fs,
            'writeFileSync',
            (...args: Parameters<typeof originalSyncWrite>) => {
                if (args[0] === path) throw failure
                return originalSyncWrite(...args)
            }
        )
        t.mock.method(
            fs.promises,
            'writeFile',
            async (...args: Parameters<typeof originalWrite>) => {
                if (args[0] === path) throw failure
                return originalWrite(...args)
            }
        )
        await assert.rejects(
            update('write-error'),
            (error) => error === failure
        )
        assert.equal(cache.size, 0)
        assert.deepEqual(
            loadManifest<{ routes: unknown }>(path, false).routes,
            {}
        )
    })
})

test('unchanged manifest bytes do not trigger another write', async (t) => {
    await withManifest(t, async ({ path, update, cache }) => {
        await update('same')
        const bytes = fs.readFileSync(path, 'utf8')
        cache.clear()
        const originalSyncWrite = fs.writeFileSync
        const originalWrite = fs.promises.writeFile
        let writes = 0
        t.mock.method(
            fs,
            'writeFileSync',
            (...args: Parameters<typeof originalSyncWrite>) => {
                if (args[0] === path) writes++
                return originalSyncWrite(...args)
            }
        )
        t.mock.method(
            fs.promises,
            'writeFile',
            async (...args: Parameters<typeof originalWrite>) => {
                if (args[0] === path) writes++
                return originalWrite(...args)
            }
        )
        await update('same')
        assert.equal(writes, 0)
        assert.equal(fs.readFileSync(path, 'utf8'), bytes)
    })
})

test('CJS and ESM updates both keep the manifest transaction synchronous', () => {
    for (const variant of ['server', 'esm/server']) {
        const source = fs.readFileSync(
            require.resolve(`next/dist/${variant}/dev/next-dev-server.js`),
            'utf8'
        )
        const start = source.indexOf('const rawExistingManifest =')
        const end = source.indexOf(
            'this.staticPathsCache.set(pathname, value)',
            start
        )
        assert.ok(
            start >= 0 && end > start,
            `${variant}: locate manifest update`
        )
        const transaction = source.slice(start, end)
        assert.match(transaction, /\.readFileSync\(/)
        assert.match(transaction, /\.writeFileSync\(/)
        assert.match(
            transaction,
            /JSON\.stringify\(existingManifest, null, 2\)/
        )
        assert.doesNotMatch(transaction, /\bawait\b/)
    }
})

test('both dev bundler variants initialize shared manifests synchronously', () => {
    for (const variant of ['server', 'esm/server']) {
        const source = fs.readFileSync(
            require.resolve(
                `next/dist/${variant}/lib/router-utils/setup-dev-bundler.js`
            ),
            'utf8'
        )
        for (const name of [
            'routesManifestPath',
            'previewPropsManifestPath',
            'prerenderManifestPath',
        ]) {
            assert.match(source, new RegExp(`\\.writeFileSync\\(${name},`))
            assert.doesNotMatch(
                source,
                new RegExp(`await [^\\n]*\\.writeFile\\(${name},`)
            )
        }
    }
})

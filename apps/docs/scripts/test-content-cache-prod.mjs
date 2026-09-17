import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { assertLocaleBoundary } from './test-utils/assert-locale-boundary.mjs'
import { assertLocaleCacheKey } from './test-utils/assert-locale-cache-key.mjs'
import { assertLocaleRouting } from './test-utils/assert-locale-routing.mjs'

const app = fileURLToPath(new URL('..', import.meta.url))
const root = join(app, '../..')
const localeCacheKey = process.argv.includes('--locale-cache-key')
const localeBoundary =
    localeCacheKey || process.argv.includes('--locale-boundary')
const functionCacheOnly =
    localeBoundary || process.argv.includes('--function-cache-only')
const minimal =
    !localeBoundary &&
    (functionCacheOnly || process.argv.includes('--cache-components-minimal'))
const cacheComponents =
    localeBoundary || minimal || process.argv.includes('--cache-components')
const debugPrerender = process.argv.includes('--debug-prerender')
assert.ok(
    process.argv
        .slice(2)
        .every((arg) =>
            [
                '--cache-components',
                '--cache-components-minimal',
                '--debug-prerender',
                '--function-cache-only',
                '--locale-boundary',
                '--locale-cache-key',
            ].includes(arg)
        ),
    'Unknown argument'
)
const sandbox = await mkdtemp(join(tmpdir(), 'docs-cache-prod-'))
const copy = join(sandbox, 'apps/docs')
const token = randomBytes(32).toString('hex')
const counts = { index: 0, body: 0 }
let version = 1
let server
let logs = ''
let interrupted = false
let originGate
let releaseOrigin
let blockedRequests = 0
const children = new Set()

const origin = createServer(async (request, response) => {
    if (request.headers.authorization !== `Bearer ${token}`) {
        response.writeHead(401).end()
        return
    }
    if (originGate) {
        blockedRequests++
        await originGate
    }
    response.setHeader('Cache-Control', 'private, no-store')
    if (request.url === '/api/posts') {
        counts.index++
        response.setHeader('Content-Type', 'application/json')
        response.end(
            JSON.stringify({
                results: [
                    {
                        id: 'feed/cache-probe',
                        slug: 'cache-probe',
                        markdownPath: 'feed/cache-probe',
                        title: `CACHE_TITLE_V${version}`,
                        summary: 'Cache integration fixture',
                        date: '2026-09-12',
                        status: 'published',
                    },
                ],
            })
        )
    } else if (request.url === '/posts/feed/cache-probe') {
        counts.body++
        response.setHeader('Content-Type', 'text/html')
        response.end(
            `<article><h1>CACHE_BODY_V${version}</h1><p>Fixture body</p></article>`
        )
    } else {
        response.writeHead(404).end()
    }
})

async function listen(httpServer) {
    await new Promise((resolve, reject) => {
        httpServer.once('error', reject)
        httpServer.listen(0, '127.0.0.1', resolve)
    })
    return httpServer.address().port
}

function launch(args, env) {
    const child = spawn(
        process.execPath,
        [join(app, 'node_modules/next/dist/bin/next'), ...args],
        {
            cwd: copy,
            env,
            stdio: ['ignore', 'pipe', 'pipe'],
        }
    )
    children.add(child)
    child.done = new Promise((resolve, reject) => {
        child.once('error', reject)
        child.once('exit', (code, signal) => {
            children.delete(child)
            resolve({ code, signal })
        })
    })
    for (const stream of [child.stdout, child.stderr]) {
        stream.on('data', (data) => {
            logs = (logs + data.toString()).slice(-24_000)
        })
    }
    return child
}

async function stop(child) {
    if (!children.has(child)) return
    child.kill('SIGTERM')
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000)
    try {
        await child.done
    } finally {
        clearTimeout(timer)
    }
}

function interrupt() {
    interrupted = true
    for (const child of children) child.kill('SIGTERM')
}
process.once('SIGINT', interrupt)
process.once('SIGTERM', interrupt)

try {
    // No developer .env, build cache, or production credentials enter this copy.
    await cp(app, copy, {
        recursive: true,
        filter: (path) =>
            !(minimal && path === join(app, 'app')) &&
            ![
                'node_modules',
                '.next',
                '.git',
                '.vercel',
                'test-results',
                'playwright-report',
            ].includes(basename(path)) &&
            !basename(path).startsWith('.env'),
    })
    await symlink(join(app, 'node_modules'), join(copy, 'node_modules'), 'dir')
    await symlink(
        join(root, 'node_modules'),
        join(sandbox, 'node_modules'),
        'dir'
    )
    await symlink(join(root, 'packages'), join(sandbox, 'packages'), 'dir')
    await cp(join(root, 'package.json'), join(sandbox, 'package.json'))
    // The CRP browser test imports this workspace example during type checking.
    await cp(
        join(root, 'docs/examples/critical-rendering-path-lab'),
        join(sandbox, 'docs/examples/critical-rendering-path-lab'),
        {
            recursive: true,
            filter: (path) =>
                !['node_modules', '.git', '.next'].includes(basename(path)) &&
                !basename(path).startsWith('.env'),
        }
    )
    if (minimal) {
        await cp(
            join(app, 'scripts/fixtures/cache-components-app'),
            join(copy, 'app/[locale]'),
            { recursive: true }
        )
        const webhook = join(copy, 'app/api/revalidate/content/route.ts')
        await mkdir(dirname(webhook), { recursive: true })
        await cp(join(app, 'app/api/revalidate/content/route.ts'), webhook)
    }
    const probe = join(copy, 'app/[locale]/api/cache-probe/route.ts')
    if (localeCacheKey) {
        const route = join(copy, 'app/[locale]/api/locale-cache-probe/route.ts')
        await mkdir(dirname(route), { recursive: true })
        await cp(join(app, 'scripts/fixtures/locale-cache-probe.ts'), route)
    }
    if (localeBoundary) {
        await cp(
            join(copy, 'app/[locale]/layout.tsx'),
            join(copy, 'app/[locale]/layout.cache-base.tsx')
        )
        await cp(
            join(app, 'scripts/fixtures/cache-locale-layout.mjs'),
            join(copy, 'app/[locale]/layout.tsx')
        )
        const localePage = join(copy, 'app/[locale]/cache-locale-probe/page.tsx')
        await mkdir(dirname(localePage), { recursive: true })
        await cp(
            join(app, 'scripts/fixtures/cache-locale-page.tsx'),
            localePage
        )
    }
    await mkdir(dirname(probe), { recursive: true })
    await cp(
        join(
            app,
            cacheComponents
                ? 'scripts/fixtures/cache-components-probe.ts'
                : 'scripts/fixtures/cache-probe.ts'
        ),
        probe
    )
    if (cacheComponents) {
        await cp(
            join(copy, 'next.config.mjs'),
            join(copy, 'next.cache-base.mjs')
        )
        await cp(
            join(app, 'scripts/fixtures/cache-components.config.mjs'),
            join(copy, 'next.config.mjs')
        )
    }
    console.log(
        '[cache-test] Model:',
        cacheComponents
            ? functionCacheOnly
                ? 'Cache Components (function cache only)'
                : 'Cache Components (layered over existing fetch cache)'
            : 'Previous Model'
    )
    assert.ok(!interrupted, 'Interrupted')
    const originPort = await listen(origin)
    const reservation = createServer()
    const port = await listen(reservation)
    await new Promise((resolve) => reservation.close(resolve))
    const base = `http://127.0.0.1:${port}`
    const env = Object.fromEntries(
        Object.entries(process.env).filter(([key]) =>
            /^(PATH|HOME|TMPDIR|LANG|LC_ALL|SystemRoot)$/.test(key)
        )
    )
    Object.assign(env, {
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
        BLOG_CONTENT_API_BASE_URL: `http://127.0.0.1:${originPort}`,
        BLOG_CONTENT_API_TOKEN: token,
        BLOG_CONTENT_REVALIDATE_TOKEN: token,
        BLOG_CONTENT_REVALIDATE_SECONDS: functionCacheOnly ? '0' : '3600',
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
    })
    console.log(
        '[cache-test] next build --webpack (isolated app; may take several minutes)'
    )
    console.log(
        '[cache-test] App scope:',
        minimal
            ? 'minimal shell; real content-api and webhook'
            : 'full docs app'
    )
    const build = launch(
        [
            'build',
            '--webpack',
            ...(debugPrerender ? ['--debug-prerender'] : []),
        ],
        env
    )
    const buildTimer = setTimeout(() => build.kill('SIGTERM'), 600_000)
    let result
    try {
        result = await build.done
    } finally {
        clearTimeout(buildTimer)
    }
    assert.equal(result.code, 0, 'Production build failed or timed out')
    server = launch(
        ['start', '--hostname', '127.0.0.1', '--port', String(port)],
        env
    )
    async function request(path, options = {}) {
        assert.ok(!interrupted, 'Interrupted')
        if (path.startsWith('/api/cache-probe') || path.startsWith('/api/locale-cache-probe') || path.startsWith('/docs/')) path = `/en${path}`
        return fetch(`${base}${path}`, {
            ...options,
            signal: AbortSignal.timeout(30_000),
        })
    }
    let ready = false
    for (let attempt = 0; attempt < 120; attempt++) {
        assert.ok(children.has(server), 'next start exited before readiness')
        try {
            const response = await request('/api/revalidate/content', {
                method: 'POST',
            })
            await response.text()
            if (response.status === 401) {
                ready = true
                break
            }
        } catch {
            /* Wait for the listener, not a rendered page. */
        }
        await delay(250)
    }
    assert.ok(ready, 'next start readiness timed out')
    if (!minimal) await assertLocaleRouting(request)
    if (localeBoundary) {
        await assertLocaleBoundary(request, app)
    }
    if (localeCacheKey) {
        await assertLocaleCacheKey(request, app, token)
    }
    async function invalidate(authorization) {
        const response = await request('/api/revalidate/content', {
            method: 'POST',
            headers: authorization ? { Authorization: authorization } : {},
        })
        const payload = await response.json()
        return { response, payload }
    }
    async function readVersion(expected) {
        const response = await request('/api/cache-probe')
        assert.equal(response.status, 200)
        const data = await response.json()
        assert.equal(data.index[0].title, `CACHE_TITLE_V${expected}`)
        assert.ok(data.document.content.includes(`CACHE_BODY_V${expected}`))
    }
    function holdOrigin() {
        blockedRequests = 0
        originGate = new Promise((resolve) => {
            releaseOrigin = resolve
        })
    }
    function unblockOrigin() {
        originGate = undefined
        releaseOrigin?.()
    }
    await invalidate(`Bearer ${token}`)
    const initial = { ...counts }
    await readVersion(1)
    assert.ok(
        counts.index > initial.index && counts.body > initial.body,
        'Cold read must reach both origin endpoints'
    )
    const warm = { ...counts }
    await readVersion(1)
    assert.deepEqual(counts, warm, 'Warm reads must not reach origin')
    console.log('[PASS] Cold read and Data Cache reuse', counts)
    version = 2
    for (const authorization of [undefined, 'Bearer incorrect']) {
        const { response, payload } = await invalidate(authorization)
        assert.equal(response.status, 401)
        assert.equal(payload.message, 'Unauthorized')
        await readVersion(1)
        assert.deepEqual(
            counts,
            warm,
            'Unauthorized calls must not invalidate cache'
        )
    }
    const { response, payload } = await invalidate(`Bearer ${token}`)
    assert.equal(response.status, 200)
    assert.equal(payload.revalidated, true)
    assert.match(response.headers.get('cache-control'), /no-store/)
    assert.deepEqual(counts, warm, 'Webhook must not proactively fetch origin')
    holdOrigin()
    const blockingStart = performance.now()
    let settled = false
    const blockingRead = readVersion(2).finally(() => {
        settled = true
    })
    // Attach immediately so a failed request never becomes an unhandled rejection.
    void blockingRead.catch(() => {})
    try {
        for (let attempt = 0; attempt < 100 && !blockedRequests; attempt++) {
            await delay(10)
        }
        assert.ok(blockedRequests > 0, 'expire: 0 must request the origin')
        await delay(100)
        assert.equal(settled, false, 'expire: 0 must wait for origin response')
    } finally {
        unblockOrigin()
        await blockingRead
    }
    console.log('[PASS] expire: 0 waited for origin and returned V2', {
        elapsedMs: Math.round(performance.now() - blockingStart),
    })
    assert.ok(
        counts.index > warm.index && counts.body > warm.body,
        'Both tagged entries must refresh'
    )
    const refreshed = { ...counts }
    await readVersion(2)
    assert.deepEqual(counts, refreshed, 'Refreshed data must be cached again')
    console.log(
        '[PASS] Authentication, lazy invalidation, refreshed index/body',
        counts
    )
    version = 3
    for (const authorization of [undefined, 'Bearer incorrect']) {
        const denied = await request('/api/cache-probe', {
            method: 'POST',
            headers: authorization ? { Authorization: authorization } : {},
        })
        assert.equal(denied.status, 401)
        await denied.text()
    }
    const beforeMax = { ...counts }
    const invalidated = await request('/api/cache-probe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    })
    assert.equal(invalidated.status, 200)
    assert.equal((await invalidated.json()).revalidated, true)
    assert.deepEqual(counts, beforeMax, 'max must not proactively fetch')
    holdOrigin()
    const swrStart = performance.now()
    let deadline
    try {
        await Promise.race([
            readVersion(2),
            new Promise((_, reject) => {
                deadline = setTimeout(
                    () => reject(new Error('max blocked on origin')),
                    1500
                )
            }),
        ])
        console.log('[PASS] max returned stale V2 while origin was held', {
            elapsedMs: Math.round(performance.now() - swrStart),
        })
    } finally {
        clearTimeout(deadline)
        unblockOrigin()
    }
    let updated = false
    let lastObserved
    for (let attempt = 0; attempt < 100; attempt++) {
        const response = await request('/api/cache-probe')
        assert.equal(response.status, 200)
        const data = await response.json()
        lastObserved = {
            title: data.index[0]?.title,
            hasV3Body: data.document?.content.includes('CACHE_BODY_V3'),
            counts: { ...counts },
        }
        if (
            data.index[0].title === 'CACHE_TITLE_V3' &&
            data.document.content.includes('CACHE_BODY_V3')
        ) {
            updated = true
            break
        }
        await delay(50)
    }
    assert.ok(
        updated,
        `Background revalidation must eventually publish V3: ${JSON.stringify(lastObserved)}`
    )
    assert.ok(counts.index > beforeMax.index && counts.body > beforeMax.body)
    const afterMax = { ...counts }
    await readVersion(3)
    assert.deepEqual(counts, afterMax, 'max refreshed results must be cached')
    console.log('[PASS] max background refresh and warm V3 reuse', counts)
    console.log('[cache-test] Checking article response', { minimal })
    const page = await request('/docs/feed/cache-probe')
    assert.equal(page.status, 200)
    assert.ok(
        (await page.text()).includes('CACHE_BODY_V3'),
        'Article must render fresh body'
    )
    console.log('[PASS] Article renders V3', { minimal })
    console.log('[cache-test] All checks passed')
} catch (error) {
    console.error(logs.replaceAll(token, '[REDACTED]'))
    console.error(error)
    process.exitCode = 1
} finally {
    releaseOrigin?.()
    for (const child of children) await stop(child)
    origin.closeAllConnections()
    await new Promise((resolve) => origin.close(resolve))
    await rm(sandbox, { recursive: true, force: true })
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
}

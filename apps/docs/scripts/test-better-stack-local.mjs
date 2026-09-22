import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const app = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(join(app, 'package.json'))
const nextRoot = dirname(require.resolve('next/package.json'))
const { loadEnvConfig } = require(
    require.resolve('@next/env', { paths: [nextRoot] })
)
loadEnvConfig(app, true, { info() {}, error() {} })
const token = process.env.DOCS_BETTER_STACK_SOURCE_TOKEN?.trim()
const ingestingUrl = process.env.DOCS_BETTER_STACK_INGESTING_URL?.trim()
assert.ok(
    token && ingestingUrl,
    'Set the Better Stack source token and ingesting URL in apps/docs/.env.local'
)
let destination
try {
    destination = new URL(ingestingUrl)
} catch {
    throw new Error('DOCS_BETTER_STACK_INGESTING_URL must start with https://')
}
assert.ok(
    destination.protocol === 'https:' &&
        !destination.username &&
        !destination.password &&
        !destination.search &&
        !destination.hash &&
        destination.pathname === '/',
    'The ingesting URL must be an HTTPS origin'
)

const runId = `local-probe-${randomUUID()}`
const sandbox = await mkdtemp(join(tmpdir(), 'docs-better-stack-'))
let child
let childDone
let logs = ''
let malformed = false
let upstreamCalls = 0
const origin = createServer((request, response) => {
    if (request.url !== '/api/posts') {
        response.writeHead(404).end()
        return
    }
    upstreamCalls++
    response.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
    })
    response.end(JSON.stringify(malformed ? { data: [] } : []))
})
async function listen(server) {
    await new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    return server.address().port
}
async function close(server) {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
}
const interrupt = () => child?.kill('SIGTERM')
process.once('SIGINT', interrupt)
process.once('SIGTERM', interrupt)

try {
    const upstreamPort = await listen(origin)
    const portReservation = createServer()
    const port = await listen(portReservation)
    await close(portReservation)
    for (const directory of ['lib', 'data', 'category']) {
        await cp(join(app, directory), join(sandbox, directory), {
            recursive: true,
        })
    }
    for (const directory of ['shared/assets', 'shared/i18n']) {
        await cp(join(app, directory), join(sandbox, directory), {
            recursive: true,
        })
    }
    await symlink(
        join(app, 'node_modules'),
        join(sandbox, 'node_modules'),
        'dir'
    )
    await mkdir(join(sandbox, 'app/api/health'), { recursive: true })
    await cp(join(app, 'app/sitemap.ts'), join(sandbox, 'app/sitemap.ts'))
    await writeFile(
        join(sandbox, 'package.json'),
        JSON.stringify({
            name: 'docs-better-stack-local-probe',
            private: true,
            type: 'module',
        })
    )
    await writeFile(
        join(sandbox, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                module: 'esnext',
                moduleResolution: 'bundler',
                jsx: 'preserve',
                esModuleInterop: true,
                skipLibCheck: true,
                paths: { '~/*': ['./*'] },
            },
        })
    )
    await writeFile(
        join(sandbox, 'app/layout.tsx'),
        'export default function Layout({children}) { return <html><body>{children}</body></html> }'
    )
    await writeFile(
        join(sandbox, 'app/api/health/route.ts'),
        'export function GET() { return Response.json({ok:true}) }'
    )
    // Observe the real sender's result only in the disposable copy. No mocks of
    // ingestion/authentication and no production source changes are involved.
    await cp(
        join(app, 'lib/better-stack.ts'),
        join(sandbox, 'lib/better-stack-original.ts')
    )
    await writeFile(
        join(sandbox, 'lib/better-stack.ts'),
        `
import { sendBetterStackEvent as send } from './better-stack-original.ts'
export async function sendBetterStackEvent(event, config, options) {
    const result = await send({...event, test_run_id: ${JSON.stringify(runId)}}, {...config, environment: 'development'}, options)
    console.info('BETTER_STACK_PROBE_DELIVERY=' + JSON.stringify(result))
    return result
}
`
    )
    const childEnv = {
        ...process.env,
        NODE_ENV: 'development',
        NEXT_TELEMETRY_DISABLED: '1',
        BLOG_CONTENT_API_BASE_URL_PUBLIC: `http://127.0.0.1:${upstreamPort}`,
        BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
        BLOG_CONTENT_API_BASE_URL: '',
        BLOG_CONTENT_API_TOKEN: '',
        BLOG_CONTENT_API_POSTS_PATH: '/api/posts',
        BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
        BLOG_CONTENT_REVALIDATE_SECONDS: '0',
        DOCS_BETTER_STACK_SOURCE_TOKEN: token,
        DOCS_BETTER_STACK_INGESTING_URL: ingestingUrl,
        DOCS_BETTER_STACK_ENVIRONMENT: 'development',
        DOCS_SITE_URL: `http://127.0.0.1:${port}`,
    }
    child = spawn(
        process.execPath,
        [
            join(nextRoot, 'dist/bin/next'),
            'dev',
            '--webpack',
            '--hostname',
            '127.0.0.1',
            '--port',
            String(port),
        ],
        { cwd: sandbox, env: childEnv, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    childDone = new Promise((resolve) => {
        child.once('exit', resolve)
        child.once('error', resolve)
    })
    for (const stream of [child.stdout, child.stderr])
        stream.on('data', (chunk) => {
            logs = (logs + chunk.toString()).slice(-200000)
        })
    const base = `http://127.0.0.1:${port}`
    let ready = false
    for (let attempt = 0; attempt < 120; attempt++) {
        assert.ok(
            child.exitCode === null && child.signalCode === null,
            'Isolated Next server exited before readiness'
        )
        try {
            ready = (
                await fetch(`${base}/api/health`, {
                    signal: AbortSignal.timeout(1000),
                })
            ).ok
        } catch {
            // The development server may still be compiling its health route.
        }
        if (ready) break
        await delay(500)
    }
    assert.ok(ready, 'Isolated Next server readiness timed out')
    async function sitemap(query) {
        const response = await fetch(`${base}/sitemap.xml?probe=${query}`, {
            signal: AbortSignal.timeout(60000),
        })
        assert.equal(response.status, 200, 'Sitemap should return HTTP 200')
        const xml = await response.text()
        const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
            .map((match) => match[1])
            .sort()
        assert.ok(
            urls.some((url) => url.includes('/docs/')),
            'Expected local article URLs'
        )
        return urls
    }
    const baseline = await sitemap('healthy')
    assert.ok(upstreamCalls > 0, 'Baseline must reach the mock content API')
    assert.ok(
        !logs.includes('BETTER_STACK_PROBE_DELIVERY='),
        'Healthy payload must not emit errors'
    )
    console.log(
        `PASS healthy sitemap: HTTP 200, ${baseline.length} URLs, no error event`
    )
    const before = upstreamCalls
    malformed = true
    const fallback = await sitemap('invalid')
    assert.ok(
        upstreamCalls > before,
        'Invalid payload must reach the actual content pipeline'
    )
    assert.deepEqual(
        fallback,
        baseline,
        'Local URLs must remain available after schema failure'
    )
    console.log(
        `PASS invalid payload fallback: HTTP 200, same ${fallback.length} URLs`
    )
    for (
        let attempt = 0;
        attempt < 20 && !logs.includes('BETTER_STACK_PROBE_DELIVERY=');
        attempt++
    )
        await delay(100)
    const deliveries = [
        ...logs.matchAll(/BETTER_STACK_PROBE_DELIVERY=(\{[^\n]*\})/g),
    ].map((match) => JSON.parse(match[1]))
    assert.ok(
        deliveries.length > 0,
        'Expected an ingestion attempt through the real sender'
    )
    console.log(`Ingestion results: ${JSON.stringify(deliveries)}`)
    assert.ok(
        deliveries.every((result) => result.status === 'sent'),
        'Better Stack did not accept the test event; inspect delivery status above'
    )
    console.log(`PASS Better Stack accepted ${deliveries.length} event(s)`)
    console.log(
        `Live tail lookup: test_run_id=${runId}, environment=development`
    )
    console.log(
        'Dashboard visibility and alert delivery are separate checks; ingestion acceptance alone does not verify them.'
    )
} finally {
    if (child && child.exitCode === null) {
        child.kill('SIGTERM')
        const killTimer = setTimeout(() => child.kill('SIGKILL'), 5000)
        await childDone
        clearTimeout(killTimer)
    }
    await close(origin)
    await rm(sandbox, { recursive: true, force: true })
    process.removeListener('SIGINT', interrupt)
    process.removeListener('SIGTERM', interrupt)
}

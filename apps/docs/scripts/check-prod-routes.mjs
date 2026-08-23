const DEFAULT_BASE_URL = 'http://localhost:3003'
const DEFAULT_TIMEOUT_MS = 10_000
const DEFAULT_MAX_TOTAL_MS = 5_000

const DEFAULT_ROUTES = [
    '/',
    '/feed',
    '/docs',
    '/docs?q=react',
    '/web',
    '/mobile',
    '/ui-ux',
    '/docs/web/javascript-event-loop-runtime',
    '/category/fe/react/server-client-component-boundary',
]

function parseRoutes(argv) {
    const routeArgs = argv.filter((arg) => arg.startsWith('/'))

    if (routeArgs.length > 0) {
        return routeArgs
    }

    const rawRoutes = process.env.DOCS_PROD_CHECK_ROUTES?.trim()

    if (!rawRoutes) {
        return DEFAULT_ROUTES
    }

    return rawRoutes
        .split(',')
        .map((route) => route.trim())
        .filter(Boolean)
}

function formatMs(ms) {
    return `${Math.round(ms)}ms`
}

async function checkRoute({ baseUrl, route, timeoutMs }) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const url = new URL(route, baseUrl)
    const start = performance.now()

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
            },
        })
        const body = await response.arrayBuffer()
        const totalMs = performance.now() - start

        return {
            route,
            ok: response.ok,
            status: response.status,
            totalMs,
            bytes: body.byteLength,
        }
    } catch (error) {
        const totalMs = performance.now() - start

        return {
            route,
            ok: false,
            status: 0,
            totalMs,
            bytes: 0,
            error,
        }
    } finally {
        clearTimeout(timeout)
    }
}

const baseUrl = process.env.DOCS_PROD_CHECK_BASE_URL || DEFAULT_BASE_URL
const timeoutMs = Number.parseInt(
    process.env.DOCS_PROD_CHECK_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`,
    10
)
const maxTotalMs = Number.parseInt(
    process.env.DOCS_PROD_CHECK_MAX_TOTAL_MS || `${DEFAULT_MAX_TOTAL_MS}`,
    10
)
const routes = parseRoutes(process.argv.slice(2))
const results = []

for (const route of routes) {
    results.push(await checkRoute({ baseUrl, route, timeoutMs }))
}

let failed = false

for (const result of results) {
    const isSlow = result.totalMs > maxTotalMs
    const statusLabel = result.status || 'ERR'
    const line = [
        result.ok && !isSlow ? 'PASS' : 'FAIL',
        result.route,
        `status=${statusLabel}`,
        `total=${formatMs(result.totalMs)}`,
        `bytes=${result.bytes}`,
    ]

    if (result.error) {
        line.push(`error=${result.error.name || 'Error'}`)
    }

    if (isSlow) {
        line.push(`limit=${formatMs(maxTotalMs)}`)
    }

    console.log(line.join(' '))

    if (!result.ok || isSlow) {
        failed = true
    }
}

if (failed) {
    console.error(
        `[docs] Production route check failed. baseUrl=${baseUrl} timeout=${formatMs(
            timeoutMs
        )} maxTotal=${formatMs(maxTotalMs)}`
    )
    process.exitCode = 1
}

import { readFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { setTimeout as delay } from 'node:timers/promises'
import { decodeHTML } from 'entities'
import sanitizeHtml from 'sanitize-html'
import { normalizeSearchQuery } from '../shared/lib/search-query.ts'
import { stripLocale } from '../shared/i18n/locale-path.ts'

type PublicationExpectation = {
    documentPath: string
    listPath: string
    title: string
    summaryMarker: string
    searchQuery: string
    bodyMarkers: string[]
    timeoutMs: number
    requestTimeoutMs: number
    pollIntervalMs: number
    maxAttempts: number
}
type Check = 'list' | 'search' | 'article'
type State = 'pending' | 'fresh' | 'stale' | 'unavailable'
type States = Record<Check, State>
type Logger = (message: string) => void
class PublicationError extends Error {}

function fail(message: string): never {
    throw new PublicationError(message)
}
function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        fail('Publication expectation must be a JSON object.')
    return value as Record<string, unknown>
}
function text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim() || value.length > 1000)
        fail(`Invalid publication field: ${field}.`)
    return value.trim()
}
function localPath(value: unknown, field: string): string {
    const path = text(value, field)
    const base = new URL('https://publication.invalid')
    const url = new URL(path, base)
    if (
        !path.startsWith('/') ||
        path.startsWith('//') ||
        path.includes('\\') ||
        url.origin !== base.origin ||
        url.hash ||
        (field === 'documentPath' && url.search)
    )
        fail(`Invalid same-origin publication path: ${field}.`)
    return url.pathname + url.search
}
function integer(
    value: unknown,
    fallback: number,
    maximum: number,
    field: string
): number {
    if (value === undefined) return fallback
    if (
        !Number.isInteger(value) ||
        Number(value) < 1 ||
        Number(value) > maximum
    )
        fail(`Invalid publication limit: ${field}.`)
    return Number(value)
}

export function parsePublicationExpectation(
    value: unknown
): PublicationExpectation {
    const data = object(value)
    const query = text(data.searchQuery, 'searchQuery')
    if (data.searchQuery !== query || normalizeSearchQuery(query) !== query)
        fail('searchQuery must follow the public search normalization rules.')
    if (
        !Array.isArray(data.bodyMarkers) ||
        data.bodyMarkers.length < 1 ||
        data.bodyMarkers.length > 10
    )
        fail(
            'bodyMarkers must contain between 1 and 10 version-specific markers.'
        )
    return {
        documentPath: localPath(data.documentPath, 'documentPath'),
        listPath: localPath(data.listPath, 'listPath'),
        title: text(data.title, 'title'),
        summaryMarker: text(data.summaryMarker, 'summaryMarker'),
        searchQuery: query,
        bodyMarkers: data.bodyMarkers.map((marker) =>
            text(marker, 'bodyMarkers')
        ),
        timeoutMs: integer(data.timeoutMs, 60_000, 300_000, 'timeoutMs'),
        requestTimeoutMs: integer(
            data.requestTimeoutMs,
            5_000,
            30_000,
            'requestTimeoutMs'
        ),
        pollIntervalMs: integer(
            data.pollIntervalMs,
            1_000,
            30_000,
            'pollIntervalMs'
        ),
        maxAttempts: integer(data.maxAttempts, 10, 30, 'maxAttempts'),
    }
}

function visibleText(html: string): string {
    return decodeHTML(html.replace(/<[^>]*>/g, ' '))
        .replace(/\s+/gu, ' ')
        .trim()
}
function publicMarkup(html: string): string {
    // Parse before matching boundaries: hydration scripts cannot forge a card/body.
    return sanitizeHtml(html, {
        allowedTags: [
            'main',
            'a',
            'article',
            'section',
            'h1',
            'h2',
            'h3',
            'p',
            'span',
        ],
        allowedAttributes: { a: ['href'] },
        nonTextTags: ['script', 'style', 'textarea', 'noscript', 'template'],
        transformTags: {
            div: (_name, attrs) => ({
                tagName: attrs.class?.split(/\s+/).includes('mdx-wrapper')
                    ? 'article'
                    : 'span',
                attribs: {},
            }),
            article: () => ({ tagName: 'section', attribs: {} }),
        },
    })
}
function sameDocument(
    href: unknown,
    origin: string,
    documentPath: string
): boolean {
    if (typeof href !== 'string') return false
    try {
        const url = new URL(decodeHTML(href), origin)
        return (
            url.origin === origin &&
            url.pathname === documentPath &&
            !url.search &&
            !url.hash
        )
    } catch {
        return false
    }
}
export function matchesPublicationList(
    html: string,
    expected: PublicationExpectation,
    origin: string
): boolean {
    const mains = [...publicMarkup(html).matchAll(/<main>([\s\S]*?)<\/main>/g)]
    return mains.some((main) => {
        const cards = [
            ...main[1]!.matchAll(/<a href="([^"]*)">([\s\S]*?)<\/a>/g),
        ].filter((card) => sameDocument(card[1], origin, expected.documentPath))
        return (
            cards.length === 1 &&
            [...cards[0]![2]!.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].some(
                (heading) => visibleText(heading[1]!) === expected.title
            ) &&
            visibleText(cards[0]![2]!).includes(expected.summaryMarker)
        )
    })
}
export function matchesPublicationArticle(
    html: string,
    expected: PublicationExpectation
): boolean {
    return [
        ...publicMarkup(html).matchAll(/<article>([\s\S]*?)<\/article>/g),
    ].some((body) =>
        expected.bodyMarkers.every((marker) =>
            visibleText(body[1]!).includes(marker)
        )
    )
}
export function matchesPublicationSearch(
    payload: unknown,
    expected: PublicationExpectation,
    origin: string
): boolean {
    if (!payload || typeof payload !== 'object') return false
    const data = payload as Record<string, unknown>
    if (data.query !== expected.searchQuery || !Array.isArray(data.results))
        return false
    const matches = data.results.filter(
        (item) =>
            item &&
            typeof item === 'object' &&
            sameDocument(item.href, origin, stripLocale(expected.documentPath))
    )
    return (
        matches.length === 1 &&
        matches[0].title === expected.title &&
        typeof matches[0].summary === 'string' &&
        matches[0].summary.includes(expected.summaryMarker)
    )
}

async function fetchText(
    url: URL,
    init: RequestInit,
    timeoutMs: number
): Promise<string | null> {
    let response: Response
    try {
        response = await fetch(url, {
            ...init,
            redirect: 'manual',
            signal: AbortSignal.timeout(Math.max(1, Math.ceil(timeoutMs))),
        })
    } catch {
        return null
    }
    if (response.status === 401 || response.status === 403) {
        await response.body?.cancel()
        fail(`Publication request denied (HTTP ${response.status}); no retry.`)
    }
    if (
        response.status === 429 ||
        (response.status >= 300 && response.status < 400)
    ) {
        await response.body?.cancel()
        fail(`Publication request blocked (HTTP ${response.status}); no retry.`)
    }
    if (!response.ok) {
        await response.body?.cancel()
        if (init.method === 'POST')
            fail(
                `Content cache invalidation failed (HTTP ${response.status}); no retry.`
            )
        return null
    }
    const accept = new Headers(init.headers).get('Accept')
    if (!response.headers.get('content-type')?.includes(accept ?? '')) {
        await response.body?.cancel()
        return null
    }
    try {
        const reader = response.body?.getReader()
        if (!reader) return null
        const chunks: Uint8Array[] = []
        let size = 0
        for (;;) {
            const chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.byteLength
            if (size > 5 * 1024 * 1024) {
                await reader.cancel()
                fail(
                    'Publication response exceeds the 5 MiB verification limit.'
                )
            }
            chunks.push(chunk.value)
        }
        return Buffer.concat(chunks).toString('utf8')
    } catch (error) {
        if (error instanceof PublicationError) throw error
        return null
    }
}
function parseJson(value: string | null): unknown {
    try {
        return value === null ? null : JSON.parse(value)
    } catch {
        return null
    }
}

export async function verifyPublication(
    origin: string,
    expected: PublicationExpectation,
    log: Logger = console.info
) {
    const started = performance.now()
    let attempts = 0
    let states: States = {
        list: 'pending',
        search: 'pending',
        article: 'pending',
    }
    const checks: Array<[Check, URL, string]> = [
        ['list', new URL(expected.listPath, origin), 'text/html'],
        [
            'search',
            new URL(
                `/api/search?${new URLSearchParams({ q: expected.searchQuery })}`,
                origin
            ),
            'application/json',
        ],
        ['article', new URL(expected.documentPath, origin), 'text/html'],
    ]
    while (
        attempts < expected.maxAttempts &&
        performance.now() - started < expected.timeoutMs
    ) {
        attempts += 1
        // Require all three to match in one sweep; never accumulate old successes.
        states = { list: 'pending', search: 'pending', article: 'pending' }
        for (const [check, url, accept] of checks) {
            const remaining = expected.timeoutMs - (performance.now() - started)
            if (remaining <= 0) break
            const body = await fetchText(
                url,
                { headers: { Accept: accept } },
                Math.min(remaining, expected.requestTimeoutMs)
            )
            const fresh =
                body !== null &&
                (check === 'list'
                    ? matchesPublicationList(body, expected, origin)
                    : check === 'search'
                      ? matchesPublicationSearch(
                            parseJson(body),
                            expected,
                            origin
                        )
                      : matchesPublicationArticle(body, expected))
            states[check] =
                body === null ? 'unavailable' : fresh ? 'fresh' : 'stale'
        }
        log(
            `[docs] Publication check attempt=${attempts} list=${states.list} search=${states.search} article=${states.article}`
        )
        if (
            performance.now() - started < expected.timeoutMs &&
            Object.values(states).every((state) => state === 'fresh')
        ) {
            log(
                `[docs] Publication verified attempts=${attempts} elapsedMs=${Math.round(performance.now() - started)}`
            )
            return
        }
        const remaining = expected.timeoutMs - (performance.now() - started)
        if (remaining > 0 && attempts < expected.maxAttempts)
            await delay(Math.min(expected.pollIntervalMs, remaining))
    }
    fail(
        `Publication not verified after ${attempts} attempts: list=${states.list}, search=${states.search}, article=${states.article}.`
    )
}

export async function runPublicationCli(
    env: NodeJS.ProcessEnv,
    args: string[],
    log: Logger = console.info
) {
    if (
        args.length > 1 ||
        (args.length === 1 &&
            !['--invalidate-only', '--verify-only'].includes(args[0]!))
    )
        fail('Use no argument, --invalidate-only, or --verify-only.')
    const endpoint = env.DOCS_CONTENT_REVALIDATE_URL?.trim()
    if (!endpoint) fail('DOCS_CONTENT_REVALIDATE_URL is required.')
    let url: URL
    try {
        url = new URL(endpoint)
    } catch {
        fail('Invalid revalidation endpoint URL.')
    }
    if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/api/revalidate/content' ||
        (url.protocol !== 'https:' &&
            !(
                url.protocol === 'http:' &&
                ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
            ))
    )
        fail(
            'Use the HTTPS /api/revalidate/content endpoint, or HTTP on loopback only.'
        )
    let expected: PublicationExpectation | undefined
    if (args[0] !== '--invalidate-only') {
        const file = env.DOCS_CONTENT_VERIFY_FILE?.trim()
        if (!file)
            fail(
                'DOCS_CONTENT_VERIFY_FILE is required; use --invalidate-only for cache invalidation without publication verification.'
            )
        let input: unknown
        try {
            input = JSON.parse(await readFile(file, 'utf8'))
        } catch {
            fail('Unable to read publication expectation JSON.')
        }
        expected = parsePublicationExpectation(input)
    }
    if (args[0] !== '--verify-only') {
        const tokenFile = env.DOCS_CONTENT_REVALIDATE_TOKEN_FILE?.trim()
        if (!tokenFile) fail('DOCS_CONTENT_REVALIDATE_TOKEN_FILE is required.')
        let token: string
        try {
            token = (await readFile(tokenFile, 'utf8')).trim()
        } catch {
            fail('Unable to read the revalidation token file.')
        }
        if (!token || /[\r\n]/.test(token))
            fail('The revalidation token file is empty or invalid.')
        const body = await fetchText(
            url,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
            5_000
        )
        const payload = parseJson(body)
        if (
            !payload ||
            typeof payload !== 'object' ||
            (payload as Record<string, unknown>).revalidated !== true
        )
            fail(
                'Content cache invalidation did not return a successful revalidation response; no retry.'
            )
        log(
            '[docs] Content cache invalidated; this alone does not confirm publication.'
        )
    }
    if (expected) await verifyPublication(url.origin, expected, log)
    else log('[docs] Publication verification skipped (--invalidate-only).')
}

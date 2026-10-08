import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { test } from 'node:test'
import {
    matchesPublicationArticle,
    matchesPublicationList,
    matchesPublicationSearch,
    parsePublicationExpectation,
    verifyPublication,
} from './content-publication.ts'

const input = {
    documentPath: '/ko/docs/web/publication-probe',
    listPath: '/ko/docs?page=2',
    title: 'Publication & V2',
    summaryMarker: 'SUMMARY_V2',
    searchQuery: 'Publication',
    bodyMarkers: ['BODY_V2', 'END_V2'],
    timeoutMs: 1_000,
    requestTimeoutMs: 100,
    pollIntervalMs: 1,
    maxAttempts: 3,
}
const expected = parsePublicationExpectation(input)
const origin = 'http://127.0.0.1'
const card = `<a href="${input.documentPath}"><article><h3>Publication &amp; V2</h3><p>SUMMARY_V2</p></article></a>`
const list = `<main>${card}</main>`
const article =
    '<main><div class="mdx-wrapper"><h2>BODY_V2</h2><p>END_V2</p></div></main>'
const search = {
    query: input.searchQuery,
    results: [
        {
            href: '/docs/web/publication-probe',
            title: input.title,
            summary: input.summaryMarker,
        },
    ],
}

async function withServer(
    handle: (req: IncomingMessage, res: ServerResponse) => void,
    run: (base: string) => Promise<void>
) {
    const server = createServer(handle)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address === 'object')
    try {
        await run(`http://127.0.0.1:${address.port}`)
    } finally {
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        )
    }
}

function respond(req: IncomingMessage, res: ServerResponse, fresh = true) {
    const isSearch = req.url?.startsWith('/api/search?')
    res.setHeader(
        'Content-Type',
        isSearch ? 'application/json' : 'text/html; charset=utf-8'
    )
    res.end(
        isSearch
            ? JSON.stringify(
                  fresh ? search : { query: input.searchQuery, results: [] }
              )
            : fresh
              ? req.url === input.listPath
                  ? list
                  : article
              : '<main><div class="mdx-wrapper">VERSION_V1</div></main>'
    )
}

test('expectations reject cross-origin paths, unsafe search and unbounded limits', () => {
    for (const patch of [
        { documentPath: 'https://elsewhere.invalid/docs/probe' },
        { listPath: '//elsewhere.invalid/docs' },
        { documentPath: '/\\elsewhere.invalid/docs' },
        { documentPath: input.documentPath + '?token=bad' },
        { bodyMarkers: [] },
        { searchQuery: 'x'.repeat(41) },
        { searchQuery: '  Publication  ' },
        { timeoutMs: 300_001 },
        { maxAttempts: 0 },
    ])
        assert.throws(() => parsePublicationExpectation({ ...input, ...patch }))
})

test('list matches the exact card, not hydration, recommendations or another document', () => {
    assert.ok(matchesPublicationList(list, expected, origin))
    for (const html of [
        `<script>${list}</script>`,
        `<main><script>${card}</script></main>`,
        `<header>${card}</header><main>old</main>`,
        list.replace(input.documentPath, '/ko/docs/web/other'),
        list.replace('SUMMARY_V2', 'SUMMARY_V1') + '<p>SUMMARY_V2</p>',
        `<main>${card}${card}</main>`,
        `<main><template>${card}</template></main>`,
        list.replace('Publication &amp; V2', 'old') +
            '<h3>Publication &amp; V2</h3>',
    ])
        assert.equal(matchesPublicationList(html, expected, origin), false)
})

test('article requires all version markers inside the MDX body', () => {
    assert.ok(matchesPublicationArticle(article, expected))
    for (const html of [
        `<script>${article}</script>`,
        '<div class="mdx-wrapper"><script>BODY_V2 END_V2</script></div>',
        '<div class="mdx-wrapper"><style>BODY_V2 END_V2</style></div>',
        '<div class="mdx-wrapper">BODY_V1</div><p>BODY_V2 END_V2</p>',
        article.replace('END_V2', 'END_V1'),
        '<main><h1>BODY_V2 END_V2</h1><p>Not found</p></main>',
    ])
        assert.equal(matchesPublicationArticle(html, expected), false)
})

test('search requires unique canonical href, title, summary and normalized query', () => {
    assert.ok(matchesPublicationSearch(search, expected, origin))
    for (const payload of [
        null,
        {},
        { ...search, query: 'wrong' },
        {
            ...search,
            results: [{ ...search.results[0], href: input.documentPath }],
        },
        { ...search, results: [...search.results, ...search.results] },
        {
            ...search,
            results: [
                {
                    ...search.results[0],
                    href: 'https://elsewhere.invalid' + input.documentPath,
                },
            ],
        },
        { ...search, results: [{ ...search.results[0], title: 'V1' }] },
        {
            ...search,
            results: [{ ...search.results[0], summary: 'SUMMARY_V1' }],
        },
    ])
        assert.equal(matchesPublicationSearch(payload, expected, origin), false)
})

test('polls stale responses until all three surfaces agree, with public GETs only', async () => {
    let listCount = 0
    const requests: IncomingMessage[] = []
    const logs: string[] = []
    await withServer(
        (req, res) => {
            requests.push(req)
            if (req.url === input.listPath) listCount += 1
            respond(req, res, listCount >= 2)
        },
        (base) => verifyPublication(base, expected, (line) => logs.push(line))
    )
    assert.equal(requests.length, 6)
    assert.ok(
        requests.every(
            (req) => req.method === 'GET' && !req.headers.authorization
        )
    )
    assert.match(logs[0]!, /list=stale search=stale article=stale/)
    assert.match(logs.at(-1)!, /Publication verified attempts=2/)
})

test('does not accumulate successes across incompatible sweeps', async () => {
    let sweep = 0
    await withServer(
        (req, res) => {
            if (req.url === input.listPath) sweep += 1
            respond(
                req,
                res,
                sweep === 1
                    ? req.url === input.listPath
                    : req.url !== input.listPath
            )
        },
        async (base) => {
            await assert.rejects(
                verifyPublication(base, expected, () => {}),
                /Publication not verified after 3 attempts/
            )
        }
    )
})

test('HTTP 200 with stale, malformed JSON or loading/error HTML cannot pass', async () => {
    await withServer(
        (req, res) => {
            if (req.url?.startsWith('/api/search?')) {
                res.setHeader('Content-Type', 'application/json')
                res.end('{invalid')
            } else respond(req, res, false)
        },
        async (base) => {
            await assert.rejects(
                verifyPublication(base, expected, () => {}),
                /list=stale, search=stale, article=stale/
            )
        }
    )
})

test('authentication, rate limiting and redirects stop public polling immediately', async () => {
    for (const status of [401, 403, 429, 302]) {
        let count = 0
        await withServer(
            (_req, res) => {
                count += 1
                res.writeHead(status, { Location: 'https://elsewhere.invalid' })
                res.end('secret upstream diagnostic')
            },
            async (base) => {
                await assert.rejects(
                    verifyPublication(base, expected, () => {}),
                    new RegExp(`HTTP ${status}.*no retry`)
                )
            }
        )
        assert.equal(count, 1)
    }
})

test('5xx and disconnected upstream are bounded, retryable GET failures', async () => {
    let count = 0
    await withServer(
        (req, res) => {
            count += 1
            if (count <= 3) {
                res.writeHead(503)
                res.end('private body')
            } else if (count === 4) res.destroy()
            else respond(req, res)
        },
        (base) => verifyPublication(base, expected, () => {})
    )
    assert.equal(count, 9)
})

test('total deadline also bounds stalled streaming bodies', async () => {
    const started = performance.now()
    await withServer(
        (_req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.write('<main>')
        },
        async (base) => {
            const limits = parsePublicationExpectation({
                ...input,
                timeoutMs: 100,
                requestTimeoutMs: 500,
                maxAttempts: 30,
            })
            await assert.rejects(
                verifyPublication(base, limits, () => {}),
                /Publication not verified/
            )
        }
    )
    assert.ok(
        performance.now() - started < 1500,
        'should not wait for the per-request timeout after the total deadline'
    )
})

async function cli(
    base: string,
    args: string[] = [],
    patch: Record<string, unknown> = {},
    invalidJson = false
) {
    const dir = await mkdtemp(join(tmpdir(), 'publication-test-'))
    try {
        const token = 'fixture-only-publish-token'
        const tokenFile = join(dir, 'token')
        const manifest = join(dir, 'expectation.json')
        await writeFile(tokenFile, token, { mode: 0o600 })
        await writeFile(
            manifest,
            invalidJson ? '{invalid' : JSON.stringify({ ...input, ...patch })
        )
        const child = spawn(
            process.execPath,
            [
                new URL('./revalidate-content-cache.mjs', import.meta.url)
                    .pathname,
                ...args,
            ],
            {
                env: {
                    ...process.env,
                    DOCS_CONTENT_REVALIDATE_URL:
                        base + '/api/revalidate/content',
                    DOCS_CONTENT_REVALIDATE_TOKEN_FILE: tokenFile,
                    DOCS_CONTENT_VERIFY_FILE: manifest,
                },
                stdio: ['ignore', 'pipe', 'pipe'],
            }
        )
        let output = ''
        child.stdout.on('data', (chunk) => {
            output += chunk
        })
        child.stderr.on('data', (chunk) => {
            output += chunk
        })
        const [code] = await once(child, 'close')
        assert.ok(
            !output.includes(token) && !output.includes(dir),
            'must not print credentials or private paths'
        )
        assert.ok(
            !output.includes('secret upstream diagnostic'),
            'must not print upstream errors'
        )
        return { code, output }
    } finally {
        await rm(dir, { recursive: true, force: true })
    }
}

test('real CLI performs one authorized POST then unauthenticated publication checks', async () => {
    const requests: IncomingMessage[] = []
    await withServer(
        (req, res) => {
            requests.push(req)
            if (req.method === 'POST') {
                res.setHeader('Content-Type', 'application/json')
                res.end(
                    JSON.stringify({
                        revalidated: true,
                        revalidatedAt: 'private value never logged',
                    })
                )
            } else respond(req, res)
        },
        async (base) => {
            const result = await cli(base)
            assert.equal(result.code, 0)
            assert.match(result.output, /Publication verified/)
            assert.ok(!result.output.includes('private value never logged'))
        }
    )
    assert.equal(requests.length, 4)
    assert.equal(
        requests[0]!.headers.authorization,
        'Bearer fixture-only-publish-token'
    )
    assert.ok(requests.slice(1).every((req) => !req.headers.authorization))
})

test('real CLI exits nonzero when webhook succeeds but publication remains stale', async () => {
    let posts = 0
    await withServer(
        (req, res) => {
            if (req.method === 'POST') {
                posts += 1
                res.setHeader('Content-Type', 'application/json')
                res.end('{"revalidated":true}')
            } else respond(req, res, false)
        },
        async (base) => {
            const result = await cli(base)
            assert.equal(result.code, 1)
            assert.match(result.output, /Publication not verified/)
            assert.doesNotMatch(result.output, /Publication verified/)
        }
    )
    assert.equal(posts, 1)
})

test('real CLI fails webhook authentication without retries or public reads', async () => {
    for (const status of [401, 403]) {
        let count = 0
        await withServer(
            (_req, res) => {
                count += 1
                res.writeHead(status)
                res.end('secret upstream diagnostic')
            },
            async (base) => {
                const result = await cli(base)
                assert.equal(result.code, 1)
                assert.match(result.output, new RegExp(`HTTP ${status}`))
            }
        )
        assert.equal(count, 1)
    }
})

test('invalid expectations fail before invalidation and mode selection stays explicit', async () => {
    let posts = 0
    let reads = 0
    await withServer(
        (req, res) => {
            if (req.method === 'POST') {
                posts += 1
                res.setHeader('Content-Type', 'application/json')
                res.end('{"revalidated":true}')
            } else {
                reads += 1
                respond(req, res)
            }
        },
        async (base) => {
            assert.equal(
                (await cli(base, [], { listPath: '//elsewhere.invalid' })).code,
                1
            )
            assert.equal((await cli(base, [], {}, true)).code, 1)
            assert.equal(posts, 0)
            const only = await cli(base, ['--invalidate-only'], {}, true)
            assert.equal(only.code, 0)
            assert.match(only.output, /verification skipped/)
            assert.equal(reads, 0)
            const verify = await cli(base, ['--verify-only'])
            assert.equal(verify.code, 0)
            assert.equal(posts, 1)
            assert.equal(reads, 3)
        }
    )
})

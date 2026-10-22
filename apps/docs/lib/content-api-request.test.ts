import assert from 'node:assert/strict'
import test from 'node:test'
import { inspect } from 'node:util'
import {
    ContentApiRequestError,
    readContentApiResponse,
} from './content-api-request.ts'

const url = 'https://content.example.test/api/posts'

test('network failure never retries and does not expose authentication', async () => {
    let calls = 0
    await assert.rejects(
        readContentApiResponse(url, {
            deadline: Date.now() + 1000,
            headers: { Authorization: 'Bearer test-only' },
            fetch: async () => {
                calls++
                throw new TypeError('fetch failed')
            },
        }),
        (error: unknown) => {
            assert.ok(error instanceof ContentApiRequestError)
            assert.equal(error.kind, 'network')
            assert.doesNotMatch(
                inspect(error, { depth: 10 }),
                /Authorization|Bearer|test-only/i
            )
            assert.equal('request' in error || 'cause' in error, false)
            return true
        }
    )
    assert.equal(calls, 1)
})

test('HTTP failures including authentication and throttling never retry', async () => {
    for (const status of [401, 403, 404, 429, 502, 503, 530]) {
        let calls = 0
        await assert.rejects(
            readContentApiResponse(url, {
                deadline: Date.now() + 1000,
                fetch: async () => {
                    calls++
                    return new Response('error', { status })
                },
            }),
            (error: unknown) =>
                error instanceof ContentApiRequestError &&
                error.kind === 'http' &&
                error.status === status
        )
        assert.equal(calls, 1)
    }
})

test('deadline aborts a connection that never sends headers', async () => {
    let signal: AbortSignal | null | undefined
    const started = Date.now()
    await assert.rejects(
        readContentApiResponse(url, {
            deadline: started + 40,
            fetch: async (request) => {
                signal = (request as Request).signal
                return new Promise<Response>(() => {})
            },
        }),
        { kind: 'timeout' }
    )
    assert.equal(signal?.aborted, true)
    assert.ok(Date.now() - started < 1000)
})

test('deadline includes a stalled body after successful headers and cancels it', async () => {
    let cancelled = false
    const started = Date.now()
    await assert.rejects(
        readContentApiResponse(url, {
            deadline: started + 40,
            fetch: async () =>
                new Response(
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(new TextEncoder().encode('{'))
                        },
                        cancel() {
                            cancelled = true
                        },
                    })
                ),
        }),
        { kind: 'timeout' }
    )
    assert.ok(Date.now() - started < 1000)
    assert.equal(cancelled, true)
})

test('slow chunks cannot reset the total body deadline', async () => {
    let interval: ReturnType<typeof setInterval>
    let chunks = 0
    await assert.rejects(
        readContentApiResponse(url, {
            deadline: Date.now() + 70,
            fetch: async () =>
                new Response(
                    new ReadableStream({
                        start(controller) {
                            interval = setInterval(() => {
                                chunks++
                                controller.enqueue(new Uint8Array([65]))
                            }, 10)
                        },
                        cancel() {
                            clearInterval(interval)
                        },
                    })
                ),
        }),
        { kind: 'timeout' }
    )
    assert.ok(chunks > 0)
})

test('one deadline is shared by index and body and expired requests do not start', async () => {
    const deadline = Date.now() + 80
    const fetch: typeof globalThis.fetch = async () => {
        let timer: ReturnType<typeof setTimeout>
        return new Response(
            new ReadableStream({
                start(controller) {
                    timer = setTimeout(() => {
                        controller.enqueue(new Uint8Array([65]))
                        controller.close()
                    }, 50)
                },
                cancel() {
                    clearTimeout(timer)
                },
            })
        )
    }
    assert.equal(
        (await readContentApiResponse(url, { deadline, fetch })).text,
        'A'
    )
    await assert.rejects(readContentApiResponse(url, { deadline, fetch }), {
        kind: 'timeout',
    })
    let calls = 0
    await assert.rejects(
        readContentApiResponse(url, {
            deadline: Date.now() - 1,
            fetch: async () => {
                calls++
                return new Response('x')
            },
        }),
        { kind: 'timeout' }
    )
    assert.equal(calls, 0)
})

test('successful UTF-8 content is preserved and blank bodies fail', async () => {
    const result = await readContentApiResponse(url, {
        deadline: Date.now() + 1000,
        fetch: async () =>
            new Response('한글 <h2>OK</h2>', {
                headers: { 'Content-Type': 'text/html' },
            }),
    })
    assert.equal(result.text, '한글 <h2>OK</h2>')
    assert.equal(result.contentType, 'text/html')
    for (const text of ['', '  \n'])
        await assert.rejects(
            readContentApiResponse(url, {
                deadline: Date.now() + 1000,
                fetch: async () => new Response(text),
            }),
            { kind: 'empty' }
        )
})

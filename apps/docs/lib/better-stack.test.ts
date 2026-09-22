import assert from 'node:assert/strict'
import test from 'node:test'
import { sendBetterStackEvent } from './better-stack.ts'

const config = {
    sourceToken: 'test-token',
    ingestingUrl: 'https://logs.example.com',
    environment: 'preview',
}

test('sends structured JSON with server authentication and environment', async () => {
    let calls = 0
    const result = await sendBetterStackEvent(
        { event: 'schema-failure' },
        config,
        {
            fetch: async (url, init) => {
                calls++
                assert.equal(String(url), 'https://logs.example.com/')
                assert.equal(init?.method, 'POST')
                assert.equal(
                    new Headers(init?.headers).get('authorization'),
                    'Bearer test-token'
                )
                assert.equal(init?.redirect, 'error')
                assert.equal(init?.cache, 'no-store')
                const body = JSON.parse(String(init?.body))
                assert.equal(body.event, 'schema-failure')
                assert.equal(body.environment, 'preview')
                assert.equal(body.service, 'docs')
                assert.ok(Number.isFinite(Date.parse(body.dt)))
                assert.ok(!String(init?.body).includes('test-token'))
                return new Response(null, { status: 202 })
            },
        }
    )
    assert.deepEqual(result, { status: 'sent' })
    assert.equal(calls, 1)
})

test('does not send when disabled or configuration is incomplete/unsafe', async () => {
    let calls = 0
    const fetchMock: typeof fetch = async () => {
        calls++
        return new Response()
    }
    assert.deepEqual(await sendBetterStackEvent({}, {}, { fetch: fetchMock }), {
        status: 'disabled',
    })
    for (const invalid of [
        { ...config, sourceToken: '' },
        { ...config, environment: '' },
        { ...config, ingestingUrl: '' },
        { ...config, ingestingUrl: 'invalid' },
        { ...config, ingestingUrl: 'http://logs.example.com' },
        { ...config, ingestingUrl: 'https://user:secret@logs.example.com' },
        { ...config, ingestingUrl: 'https://logs.example.com/?token=secret' },
        { ...config, ingestingUrl: 'https://logs.example.com/dashboard' },
    ]) {
        assert.deepEqual(
            await sendBetterStackEvent({}, invalid, { fetch: fetchMock }),
            { status: 'invalid-config' }
        )
    }
    assert.equal(calls, 0)
})

test('quota, authentication and server rejection never retry or throw', async () => {
    for (const status of [402, 403, 429, 500]) {
        let calls = 0
        const result = await sendBetterStackEvent({}, config, {
            fetch: async () => {
                calls++
                return new Response('private response', { status })
            },
        })
        assert.deepEqual(result, { status: 'rejected', httpStatus: status })
        assert.equal(calls, 1)
        assert.ok(!JSON.stringify(result).includes('private response'))
    }
})

test('network failure does not leak exception text or prevent fallback', async () => {
    assert.deepEqual(
        await sendBetterStackEvent({}, config, {
            fetch: async () => {
                throw new Error('secret endpoint credentials')
            },
        }),
        { status: 'failed' }
    )
})

test('aborts slow ingestion within the configured deadline', async () => {
    let signal: AbortSignal | null | undefined
    const result = await sendBetterStackEvent({}, config, {
        timeoutMs: 10,
        fetch: async (_url, init) => {
            signal = init?.signal
            return new Promise((_resolve, reject) => {
                signal?.addEventListener(
                    'abort',
                    () => reject(new Error('Aborted')),
                    { once: true }
                )
            })
        },
    })
    assert.deepEqual(result, { status: 'failed' })
    assert.equal(signal?.aborted, true)
})

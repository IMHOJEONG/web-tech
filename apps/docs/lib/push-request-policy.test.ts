import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    isSameOriginPushRequest,
    readPushRequestBody,
} from './push-request-policy.ts'

function request(origin: string, body = '{}') {
    return new Request('https://heap-forge.app/api/push/subscriptions', {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body,
    })
}

test('push mutations require matching origin and JSON', () => {
    assert.equal(
        isSameOriginPushRequest(request('https://heap-forge.app')),
        true
    )
    assert.equal(
        isSameOriginPushRequest(request('https://evil.example')),
        false
    )
    assert.equal(isSameOriginPushRequest(request('null')), false)
    const missing = new Request(
        'https://heap-forge.app/api/push/subscriptions',
        { method: 'POST' }
    )
    assert.equal(isSameOriginPushRequest(missing), false)
})

test('push request parsing rejects invalid or oversized bodies', async () => {
    assert.deepEqual(
        await readPushRequestBody(
            request('https://heap-forge.app', '{"endpoint":"test"}')
        ),
        { endpoint: 'test' }
    )
    await assert.rejects(
        readPushRequestBody(request('https://heap-forge.app', 'not json'))
    )
    await assert.rejects(
        readPushRequestBody(request('https://heap-forge.app', ' '.repeat(4097)))
    )
})

test('development restores the exact loopback host without relaxing production origins', () => {
    const previous = process.env.NODE_ENV
    const localRequest = new Request(
        'http://localhost:3017/api/push/subscriptions',
        {
            method: 'POST',
            headers: {
                host: '127.0.0.1:3017',
                origin: 'http://127.0.0.1:3017',
                'content-type': 'application/json',
            },
            body: '{}',
        }
    )
    try {
        Reflect.set(process.env, 'NODE_ENV', 'development')
        assert.equal(isSameOriginPushRequest(localRequest), true)
        localRequest.headers.set('host', '127.0.0.1:3018')
        assert.equal(isSameOriginPushRequest(localRequest), false)
        localRequest.headers.set('host', 'evil.example')
        assert.equal(isSameOriginPushRequest(localRequest), false)
        localRequest.headers.set('host', '127.0.0.1:3017')
        Reflect.set(process.env, 'NODE_ENV', 'production')
        assert.equal(isSameOriginPushRequest(localRequest), false)
    } finally {
        if (previous === undefined)
            Reflect.deleteProperty(process.env, 'NODE_ENV')
        else Reflect.set(process.env, 'NODE_ENV', previous)
    }
})

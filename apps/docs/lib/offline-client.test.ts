import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    listenForOfflineArticleContext,
    sendOfflineMessage,
} from '../feature/offline/model/offline-client.ts'
import {
    getOfflineFailure,
    getOfflineErrorMessageKey,
    OfflineOperationError,
} from '../feature/offline/model/offline-error.ts'
import { getDocsServiceWorkerRegistration } from '../shared/lib/docs-service-worker.ts'

function browser(serviceWorker: unknown) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { serviceWorker },
    })
    return () => {
        if (previous) Object.defineProperty(globalThis, 'navigator', previous)
        else Reflect.deleteProperty(globalThis, 'navigator')
    }
}

test('an existing active worker is usable while an update is waiting', async () => {
    const active = { state: 'activated' }
    const waiting = new EventTarget()
    Object.assign(waiting, { state: 'installed' })
    const registration = { active, waiting, installing: null }
    const restore = browser({ register: async () => registration })
    try {
        assert.equal(await getDocsServiceWorkerRegistration(), registration)
    } finally {
        restore()
    }
})

test('a first worker activation failure has its own diagnostic', async () => {
    const installing = new EventTarget()
    Object.assign(installing, { state: 'redundant' })
    const restore = browser({ register: async () => ({ installing }) })
    try {
        await assert.rejects(sendOfflineMessage('save', {}, true), {
            code: 'activation',
            stage: 'activation',
        })
    } finally {
        restore()
    }
})

test('first worker activation timeout remains bounded and distinguishable', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const installing = new EventTarget()
    Object.assign(installing, { state: 'installing' })
    let waiting = false
    const register = async () => {
        waiting = true
        return { installing }
    }
    const restore = browser({ register })
    try {
        const operation = sendOfflineMessage('save', {}, true)
        await Promise.resolve()
        assert.ok(waiting)
        t.mock.timers.tick(8000)
        await assert.rejects(operation, {
            code: 'activation-timeout',
            stage: 'activation',
        })
    } finally {
        restore()
    }
})

test('registration errors preserve only safe categories, not browser exception text', async () => {
    for (const [name, code] of [
        ['SecurityError', 'registration'],
        ['NotAllowedError', 'registration'],
        ['QuotaExceededError', 'registration'],
        ['TypeError', 'registration'],
    ]) {
        const restore = browser({
            register: async () => {
                throw new DOMException('sensitive original exception', name)
            },
        })
        try {
            await assert.rejects(
                sendOfflineMessage('save', {}, true),
                (error: unknown) => {
                    assert.ok(error instanceof OfflineOperationError)
                    assert.equal(error.code, code)
                    assert.equal(error.stage, 'registration')
                    assert.doesNotMatch(error.message, /sensitive/)
                    return true
                }
            )
        } finally {
            restore()
        }
    }
})

test('no registration means an empty initial list, but never a successful save', async () => {
    const restore = browser({ getRegistration: async () => undefined })
    try {
        assert.deepEqual(await sendOfflineMessage('list'), [])
        await assert.rejects(sendOfflineMessage('save'), {
            code: 'worker-unavailable',
            stage: 'registration',
        })
    } finally {
        restore()
    }
})

test('worker replies validate shape and expose only allowlisted error codes and stages', async () => {
    const article = {
        path: '/ko/docs/test',
        title: 'Public test',
        savedAt: '2026-10-31T00:00:00Z',
    }
    for (const [reply, code, stage] of [
        [
            { ok: false, error: 'storage-quota', stage: 'storage-write' },
            'storage-quota',
            'storage-write',
        ],
        [
            { ok: false, error: 'storage-denied', stage: 'storage-open' },
            'storage-denied',
            'storage-open',
        ],
        [{ ok: false, error: 'storage' }, 'storage', 'unknown'],
        [{ ok: false, error: 'source' }, 'source', 'unknown'],
        [
            { ok: false, error: 'source', stage: 'untrusted stage' },
            'source',
            'unknown',
        ],
        [
            { ok: false, error: 'untrusted exception', stage: 'private value' },
            'message-invalid',
            'message',
        ],
        [{ ok: true, articles: [null] }, 'message-invalid', 'message'],
        [{ ok: true, articles: [] }, undefined, undefined],
        [{ ok: true, articles: [article] }, undefined, undefined],
    ] as const) {
        const active = {
            postMessage(_request: unknown, ports: MessagePort[]) {
                ports[0]!.postMessage(reply)
                ports[0]!.close()
            },
        }
        const restore = browser({ getRegistration: async () => ({ active }) })
        try {
            const operation = sendOfflineMessage('list')
            if (code) await assert.rejects(operation, { code, stage })
            else assert.deepEqual(await operation, reply.articles)
        } finally {
            restore()
        }
    }
})

test('a missing worker response reports uncertainty, not confirmed storage failure', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    let posted = false
    const restore = browser({
        getRegistration: async () => ({
            active: {
                postMessage() {
                    posted = true
                },
            },
        }),
    })
    try {
        const operation = sendOfflineMessage('save')
        await Promise.resolve()
        assert.ok(posted)
        t.mock.timers.tick(8000)
        await assert.rejects(operation, {
            code: 'message-timeout',
            stage: 'message',
        })
    } finally {
        restore()
    }
})

test('postMessage failure closes the channel without leaving a timeout pending', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const restore = browser({
        getRegistration: async () => ({
            active: {
                postMessage() {
                    throw new Error('private detail')
                },
            },
        }),
    })
    try {
        await assert.rejects(sendOfflineMessage('save'), {
            code: 'message-send',
            stage: 'message',
        })
        t.mock.timers.tick(8000)
    } finally {
        restore()
    }
})

test('diagnostic normalization cannot disclose arbitrary exception text', () => {
    assert.deepEqual(
        getOfflineFailure(
            new DOMException('private', 'QuotaExceededError'),
            'storage-write'
        ),
        { code: 'storage-quota', stage: 'storage-write' }
    )
    assert.deepEqual(
        getOfflineFailure(new Error('private article contents'), 'snapshot'),
        { code: 'unknown', stage: 'snapshot' }
    )
    assert.deepEqual(getOfflineFailure(new Error('loading'), 'snapshot'), {
        code: 'loading',
        stage: 'snapshot',
    })
    assert.equal(
        getOfflineErrorMessageKey('message-timeout'),
        'responseTimeout'
    )
})

test('current article replies are limited to our Worker and omit query data; cleanup removes the listener', () => {
    const container = new EventTarget()
    const restore = browser(container)
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'location')
    const current = new URL(
        'https://heap-forge.app/ko/docs/test?q=synthetic-private'
    )
    Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: current,
    })
    const replies: unknown[] = []
    const stop = listenForOfflineArticleContext('/ko/docs/test')
    const send = (
        origin = current.origin,
        scriptURL = 'https://heap-forge.app/push-sw.js'
    ) => {
        const event = Object.assign(new Event('message'), {
            origin,
            source: { scriptURL },
            data: {
                channel: 'heap-forge-offline-context-v1',
                action: 'current-article',
            },
            ports: [
                {
                    postMessage(reply: unknown) {
                        replies.push(reply)
                    },
                    close() {},
                },
            ],
        })
        container.dispatchEvent(event)
    }
    try {
        send('https://evil.example')
        send(current.origin, 'https://evil.example/push-sw.js')
        send(current.origin, 'https://heap-forge.app/other-worker.js')
        send(current.origin, 'https://[')
        assert.equal(replies.length, 0)
        send()
        assert.deepEqual(replies, [{ ok: true, path: '/ko/docs/test' }])
        current.pathname = '/ko/feed'
        send()
        assert.deepEqual(replies[1], { ok: false, path: undefined })
        assert.doesNotMatch(JSON.stringify(replies), /synthetic-private/)
        stop()
        send()
        assert.equal(replies.length, 2)
    } finally {
        stop()
        restore()
        if (previous) Object.defineProperty(globalThis, 'location', previous)
        else Reflect.deleteProperty(globalThis, 'location')
    }
})

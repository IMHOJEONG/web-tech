import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

interface WorkerEvent {
    data?: { json(): unknown }
    notification?: { data: { url: string }; close(): void }
    waitUntil(promise: Promise<unknown>): void
}

function worker() {
    const handlers = new Map<string, (event: WorkerEvent) => void>()
    const shown: unknown[] = []
    const opened: string[] = []
    runInNewContext(
        readFileSync(new URL('../public/push-sw.js', import.meta.url), 'utf8'),
        {
            URL,
            self: {
                location: { origin: 'https://heap-forge.app' },
                addEventListener: (
                    name: string,
                    handler: (event: WorkerEvent) => void
                ) => handlers.set(name, handler),
                registration: {
                    showNotification: async (...args: unknown[]) => {
                        shown.push(args)
                    },
                },
                clients: {
                    openWindow: async (url: string) => {
                        opened.push(url)
                    },
                },
            },
        }
    )
    return { handlers, shown, opened }
}

test('push-only worker shows valid payloads and never intercepts document fetch', async () => {
    const { handlers, shown } = worker()
    assert.deepEqual([...handlers.keys()], ['push', 'notificationclick'])
    const tasks: Promise<unknown>[] = []
    handlers.get('push')?.({
        data: {
            json: () => ({ title: 'HEAP-FORGE', body: 'Test', url: '/about' }),
        },
        waitUntil: (task) => {
            tasks.push(task)
        },
    })
    await Promise.all(tasks)
    assert.equal(shown.length, 1)
    handlers.get('push')?.({
        data: {
            json: () => {
                throw new Error('invalid')
            },
        },
        waitUntil: () => assert.fail(),
    })
    assert.equal(shown.length, 1)
})

test('notification clicks cannot open an external URL or unrelated route', async () => {
    const { handlers, opened } = worker()
    const cases: [string, string][] = [
        ['/docs/web/test', 'https://heap-forge.app/docs/web/test'],
        ['https://evil.example/docs/web/test', 'https://heap-forge.app/about'],
        ['/api/private', 'https://heap-forge.app/about'],
        ['https://[', 'https://heap-forge.app/about'],
    ]
    for (const [url, expected] of cases) {
        const tasks: Promise<unknown>[] = []
        handlers.get('notificationclick')?.({
            notification: { data: { url }, close() {} },
            waitUntil: (task) => {
                tasks.push(task)
            },
        })
        await Promise.all(tasks)
        assert.equal(opened.at(-1), expected)
    }
})

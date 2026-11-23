import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
    assertUpstreamFailureTrace,
    completedCauseTrace,
    type CauseTrace,
} from './completed-cause-trace.ts'
import { attachRequestCauseTrace } from './request-cause-trace.ts'
import { observeRequest } from './request-lifecycle-observer.ts'

function snapshot(events: string[], responseFinished = false): CauseTrace {
    return {
        requestId: 'synthetic-request',
        responseFinished,
        omitted: 0,
        deliveryFailures: 0,
        events: events.map((event, index) => ({
            sequence: index + 1,
            event,
            detail: {},
        })),
    }
}

test('completed trace: client receives HTTP while the real trace finish record is held', async ({
    request,
}) => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    const server = createServer((incoming, response) => {
        const observation = observeRequest(incoming, response, () => {})
        attachRequestCauseTrace(incoming, response, observation)
        // Delay event dispatch only in this synthetic server, never in Next.
        const emit = response.emit
        response.emit = function (event: string, ...args: unknown[]) {
            if (event === 'finish' || event === 'close') {
                void gate.then(() =>
                    Reflect.apply(emit, this, [event, ...args])
                )
                return true
            }
            return Reflect.apply(emit, this, [event, ...args])
        }
        response.setHeader('x-article-request-id', observation.state.requestId)
        response.statusCode = 503
        response.end('synthetic upstream failure')
    })
    try {
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject)
            server.listen(0, '127.0.0.1', resolve)
        })
        const { port } = server.address() as AddressInfo
        const response = await request.get(
            `http://127.0.0.1:${port}/ko/docs/web/article-e2e-remote`
        )
        expect(response.status()).toBe(503)
        const id = response.headers()['x-article-request-id']!
        expect(id).toMatch(/^[\da-f-]{36}$/i)
        const readTrace = async (): Promise<CauseTrace> =>
            JSON.parse(
                await readFile(`test-results/request-cause/${id}.json`, 'utf8')
            )
        const before = await readTrace()
        expect(before.responseFinished).toBe(false)
        expect(before.events.map(({ event }) => event)).not.toContain(
            'response-finish'
        )
        let observed!: () => void
        const firstRead = new Promise<void>((resolve) => {
            observed = resolve
        })
        const completed = completedCauseTrace(async () => {
            const current = await readTrace()
            observed()
            return current
        })
        await firstRead
        release()
        const after = await completed
        expect(after.requestId).toBe(id)
        expect(after.responseFinished).toBe(true)
        expect(after.omitted).toBe(0)
        expect(after.deliveryFailures).toBe(0)
    } finally {
        release()
        server.closeAllConnections()
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        )
    }
})

test('completed trace: waits for the terminal snapshot, not client completion', async () => {
    let observed!: () => void
    const firstRead = new Promise<void>((resolve) => {
        observed = resolve
    })
    const partial = snapshot(['request-start', 'response-end-call'])
    const terminal = snapshot(
        ['request-start', 'response-end-call', 'response-finish'],
        true
    )
    let persisted = partial
    let reads = 0
    const completed = completedCauseTrace(async () => {
        reads++
        const current = persisted
        observed()
        return current
    })
    await firstRead
    // The old immediate-reader assertion fails for this same stored snapshot.
    expect(partial.responseFinished).toBe(false)
    expect(reads).toBe(1)
    persisted = terminal
    expect(await completed).toBe(terminal)
    expect(reads).toBeGreaterThan(1)
})

test('completed trace: writableFinished alone is not persisted finish evidence', async () => {
    let reads = 0
    const partial = snapshot(['response-end-call'], true)
    const terminal = snapshot(['response-finish'], true)
    expect(
        await completedCauseTrace(async () =>
            ++reads === 1 ? partial : terminal
        )
    ).toBe(terminal)
    expect(reads).toBe(2)
})

test('completed trace: aborted close fails immediately without a replacement read', async () => {
    let reads = 0
    await expect(
        completedCauseTrace(async () => {
            reads++
            return reads === 1
                ? snapshot(['response-close'])
                : snapshot(['response-finish'], true)
        })
    ).rejects.toThrow()
    expect(reads).toBe(1)
})

test('completed trace: close with no finish record still fails', async () => {
    await expect(
        completedCauseTrace(async () => snapshot(['response-close'], true))
    ).rejects.toThrow()
})

test('completed trace: malformed evidence is not retried into success', async () => {
    let reads = 0
    await expect(
        completedCauseTrace(async () => {
            reads++
            return JSON.parse('{') as CauseTrace
        })
    ).rejects.toThrow()
    expect(reads).toBe(1)
})

test('completed trace: missing terminal evidence fails within the existing assertion budget', async () => {
    await expect(
        completedCauseTrace(async () => snapshot(['response-end-call']))
    ).rejects.toThrow(/terminal response event/)
})

test('completed trace: retains every original upstream-503 acceptance condition', async () => {
    const terminal = snapshot(
        [
            'upstream-headers',
            'console-warning',
            'console-error',
            'response-finish',
        ],
        true
    )
    terminal.events[0]!.detail.status = 503
    const result = await completedCauseTrace(async () => terminal)
    expect(result).toBe(terminal)
    expect(() => assertUpstreamFailureTrace(result, false)).not.toThrow()
    const invalidTraces: [string, CauseTrace][] = [
        ['omitted event', { ...result, omitted: 1 }],
        ['delivery failure', { ...result, deliveryFailures: 1 }],
        ['unfinished response', { ...result, responseFinished: false }],
        ...['upstream-headers', 'console-warning', 'console-error'].map(
            (name): [string, CauseTrace] => [
                name,
                {
                    ...result,
                    events: result.events.filter(({ event }) => event !== name),
                },
            ]
        ),
        [
            'wrong upstream status',
            {
                ...result,
                events: result.events.map((event) => ({
                    ...event,
                    detail: { status: 200 },
                })),
            },
        ],
        [
            'framework stream error',
            {
                ...result,
                events: [
                    ...result.events,
                    {
                        sequence: 5,
                        event: 'framework-stream-error',
                        detail: {},
                    },
                ],
            },
        ],
    ]
    for (const [name, invalid] of invalidTraces) {
        await test.step(name, async () => {
            expect(() => assertUpstreamFailureTrace(invalid, false)).toThrow()
        })
    }
    expect(() => assertUpstreamFailureTrace(result, true)).toThrow()
})

import { expect, test, type APIRequestContext } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { articleFixtureAuthorization } from './fixture-credentials.ts'

const origin = 'http://127.0.0.1:3112'
const article = '/ko/docs/web/article-e2e-publication'
const headers = { 'x-article-cache-probe': '1' }
type Checkpoint = {
    runId: string
    probeId: number
    sequence: number
    omitted: number
    deliveryFailures: number
}
type Evidence = {
    runId: string
    omitted: number
    deliveryFailures: number
    events: {
        sequence: number
        probeId: number
        operation: string
        phase: string
    }[]
}

function verifyEvidence(evidence: Evidence, checkpoint: Checkpoint) {
    expect(checkpoint.omitted).toBe(0)
    expect(checkpoint.deliveryFailures).toBe(0)
    expect(evidence.omitted).toBe(0)
    expect(evidence.deliveryFailures).toBe(0)
    expect(evidence.runId).toBe(checkpoint.runId)
    expect(
        evidence.events.some(
            (event) =>
                event.sequence === checkpoint.sequence &&
                event.probeId === checkpoint.probeId &&
                event.operation === 'checkpoint' &&
                event.phase === 'end'
        )
    ).toBe(true)
    expect(
        evidence.events.some(
            (event) =>
                event.operation === 'revalidateTag' && event.phase === 'end'
        )
    ).toBe(true)
}

async function cleanupPublication(actions: {
    release: () => Promise<void>
    reset: () => Promise<void>
    drain: () => Promise<void>
    invalidate: () => Promise<void>
}) {
    const errors: unknown[] = []
    let unlocked = false
    for (const action of [actions.release, actions.reset]) {
        try {
            await action()
            unlocked = true
        } catch (error) {
            errors.push(error)
        }
    }
    if (unlocked) {
        try {
            await actions.drain()
        } catch (error) {
            errors.push(error)
        }
    }
    try {
        await actions.invalidate()
    } catch (error) {
        errors.push(error)
    }
    if (errors.length)
        throw new AggregateError(errors, 'Publication cleanup failed')
}
async function control(request: APIRequestContext, action: string) {
    const response = await request.post(
        `${origin}/__test/publication/${action}`,
        {
            headers: { Authorization: articleFixtureAuthorization('control') },
        }
    )
    expect(response.status()).toBe(204)
}
async function invalidate(request: APIRequestContext) {
    const response = await request.post('/api/revalidate/content', {
        headers: {
            ...headers,
            Authorization: articleFixtureAuthorization('revalidation'),
        },
    })
    expect(response.status()).toBe(200)
}

test('publication diagnostic: invalidation overlaps a captured origin response', async ({
    request,
}, testInfo) => {
    // This is an ordering diagnostic, not a claim about the historical failure.
    let pending: ReturnType<APIRequestContext['get']> | undefined
    try {
        await control(request, '1')
        await invalidate(request)
        await control(request, 'hold-body')
        pending = request.get(article, { headers })
        void pending.catch(() => {})
        await expect
            .poll(async () => {
                const state = await request.get(
                    `${origin}/__test/publication/state`,
                    {
                        headers: {
                            Authorization:
                                articleFixtureAuthorization('control'),
                        },
                    }
                )
                expect(state.status()).toBe(200)
                return (await state.json()).pending
            })
            .toBe(1)
        await control(request, '2')
        await invalidate(request)
        await control(request, 'release-body')
        const before = await pending
        expect(before.status()).toBe(200)
        expect((await before.text()).includes('PUBLICATION_END_V1')).toBe(true)
        const after = await request.get(article, { headers })
        expect(after.status()).toBe(200)
        const body = await after.text()
        const hasV1 = body.includes('PUBLICATION_END_V1')
        const hasV2 = body.includes('PUBLICATION_END_V2')
        expect(
            hasV1 !== hasV2,
            'A complete, unambiguous article must render'
        ).toBe(true)
        const result: Record<string, unknown> = {
            postWebhookVersion: hasV2 ? 2 : 1,
        }
        // A second webhook after all old work drains must yield the new body.
        await invalidate(request)
        const recovered = await request.get(article, { headers })
        expect(recovered.status()).toBe(200)
        expect((await recovered.text()).includes('PUBLICATION_END_V2')).toBe(
            true
        )
        // Check the persisted trace through this process-specific checkpoint.
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        const directory = process.env.ARTICLE_CACHE_OBSERVATION_DIR
        if (directory) {
            const response = await request.get(
                '/__test/cache-observation/checkpoint',
                { headers }
            )
            expect(response.status()).toBe(200)
            const checkpoint = (await response.json()) as Checkpoint
            const evidence = JSON.parse(
                await readFile(join(directory, 'cache-events.json'), 'utf8')
            ) as Evidence
            verifyEvidence(evidence, checkpoint)
            result.observedCacheEvents = evidence.events.length
        }
        await testInfo.attach('inflight-order-summary', {
            body: JSON.stringify(result),
            contentType: 'application/json',
        })
        console.info('[cache-inflight-summary]', JSON.stringify(result))
    } finally {
        await cleanupPublication({
            release: () => control(request, 'release-body'),
            reset: () => control(request, 'reset'),
            drain: async () => {
                await pending?.catch(() => {})
            },
            invalidate: () => invalidate(request),
        })
    }
})

for (const failures of [['release'], ['reset'], ['release', 'reset']]) {
    test(`publication cleanup retains failures and attempts recovery: ${failures.join(',')}`, async () => {
        const calls: string[] = []
        const action = (name: string) => async () => {
            calls.push(name)
            if (failures.includes(name))
                throw new Error(`synthetic ${name} failure`)
        }
        await expect(
            cleanupPublication({
                release: action('release'),
                reset: action('reset'),
                drain: action('drain'),
                invalidate: action('invalidate'),
            })
        ).rejects.toThrow('Publication cleanup failed')
        expect(calls).toEqual(
            failures.length === 2
                ? ['release', 'reset', 'invalidate']
                : ['release', 'reset', 'drain', 'invalidate']
        )
    })
}

test('cache evidence rejects a stale or incomplete final snapshot', () => {
    const checkpoint: Checkpoint = {
        runId: 'synthetic-run',
        probeId: 2,
        sequence: 2,
        omitted: 0,
        deliveryFailures: 0,
    }
    const evidence: Evidence = {
        runId: checkpoint.runId,
        omitted: 0,
        deliveryFailures: 0,
        events: [
            {
                sequence: 1,
                probeId: 1,
                operation: 'revalidateTag',
                phase: 'end',
            },
            { sequence: 2, probeId: 2, operation: 'checkpoint', phase: 'end' },
        ],
    }
    verifyEvidence(evidence, checkpoint)
    expect(() =>
        verifyEvidence(
            { ...evidence, events: evidence.events.slice(0, 1) },
            checkpoint
        )
    ).toThrow()
    expect(() =>
        verifyEvidence({ ...evidence, runId: 'another-run' }, checkpoint)
    ).toThrow()
    expect(() =>
        verifyEvidence(evidence, { ...checkpoint, deliveryFailures: 1 })
    ).toThrow()
})

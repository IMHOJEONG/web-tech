import { expect, test, type APIRequestContext } from '@playwright/test'
import { articleFixtureAuthorization } from './fixture-credentials.ts'
import {
    createGenerationSession,
    type GenerationMode,
} from './cache-generation-session.ts'

const article = '/ko/docs/web/article-e2e-publication'
const origin = 'http://127.0.0.1:3112'
const marked = { 'x-article-generation-probe': '1' }
const auth = { Authorization: articleFixtureAuthorization('control') }
type State = {
    generation: number
    revision: string
    requests: number
    activeRequests: number
    activeOperations: number
    lateWrites: number
    rejectedWrites: number
    lookups: {
        requestId: number
        generation: number
        resource: string
        keyHash: string
        phase: string
        hit: boolean | null
    }[]
}
async function control(request: APIRequestContext, action: string) {
    const result = await request.post(
        `${origin}/__test/publication/${action}`,
        {
            headers: auth,
        }
    )
    expect(result.status()).toBe(204)
}
async function invalidate(request: APIRequestContext) {
    const result = await request.post('/api/revalidate/content', {
        headers: { Authorization: articleFixtureAuthorization('revalidation') },
    })
    expect(result.status()).toBe(200)
}
async function state(request: APIRequestContext): Promise<State> {
    const result = await request.get('/__test/cache-generation/state', {
        headers: auth,
    })
    expect(result.status()).toBe(200)
    return result.json()
}
async function reset(request: APIRequestContext, mode: GenerationMode) {
    await expect
        .poll(async () => {
            const current = await state(request)
            return current.activeRequests + current.activeOperations
        })
        .toBe(0)
    const result = await request.post(
        `/__test/cache-generation/reset-${mode}`,
        { headers: auth }
    )
    expect(result.status()).toBe(200)
}

async function cleanupExperiment(
    request: APIRequestContext,
    pending: Promise<unknown>[],
    bodyErrors: unknown[]
) {
    const failures: unknown[] = []
    let released = false
    for (const action of ['release-body', 'reset']) {
        try {
            await control(request, action)
            released = true
        } catch (error) {
            failures.push(error)
        }
    }
    if (released) await Promise.allSettled(pending)
    for (const cleanup of [
        () => invalidate(request),
        () => reset(request, 'generation'),
    ]) {
        try {
            await cleanup()
        } catch (error) {
            failures.push(error)
        }
    }
    if (failures.length) {
        const errors = [...bodyErrors, ...failures]
        const details = errors
            .map((error) =>
                error instanceof Error ? error.message : 'non-Error failure'
            )
            .join('\n')
        throw new AggregateError(
            errors,
            `Generation experiment cleanup failed\n${details}`
        )
    }
}

async function race(
    request: APIRequestContext,
    mode: GenerationMode,
    overlap: boolean
) {
    const pending: Promise<unknown>[] = []
    const bodyErrors: unknown[] = []
    try {
        await control(request, 'reset')
        await invalidate(request)
        await reset(request, mode)
        await control(request, 'hold-body')
        const a = request.get(article, { headers: marked })
        pending.push(a)
        void a.catch(() => {})
        await expect
            .poll(async () => {
                const result = await request.get(
                    `${origin}/__test/publication/state`,
                    { headers: auth }
                )
                expect(result.status()).toBe(200)
                return (await result.json()).pending
            })
            .toBe(1)
        await control(request, '2')
        await invalidate(request)
        const advanced = await request.post(
            '/__test/cache-generation/advance-r2',
            {
                headers: { ...auth, 'x-expected-generation': '1' },
            }
        )
        expect(advanced.status()).toBe(200)
        expect(await advanced.json()).toMatchObject({
            generation: 2,
            revision: 'r2',
        })

        let b: ReturnType<APIRequestContext['get']> | undefined
        if (overlap) {
            b = request.get(article, { headers: marked })
            pending.push(b)
            void b.catch(() => {})
            await expect
                .poll(async () =>
                    (await state(request)).lookups.some(
                        (lookup) =>
                            lookup.requestId === 2 &&
                            lookup.generation === 2 &&
                            lookup.resource === 'body' &&
                            lookup.phase === 'start'
                    )
                )
                .toBe(true)
        }
        await control(request, 'release-body')
        const old = await a
        expect(old.status()).toBe(200)
        expect((await old.text()).includes('PUBLICATION_END_V1')).toBe(true)
        const fresh = await (b ?? request.get(article, { headers: marked }))
        expect(fresh.status()).toBe(200)
        const html = await fresh.text()
        if (mode === 'generation') {
            expect(
                html.includes('PUBLICATION_END_V2'),
                'New-generation B must receive V2'
            ).toBe(true)
            expect(
                html.includes('PUBLICATION_END_V1'),
                'New-generation B must not receive V1'
            ).toBe(false)
        } else {
            expect(
                html.includes('PUBLICATION_END_V1'),
                'Baseline must expose the old write'
            ).toBe(true)
            expect(html.includes('PUBLICATION_END_V2')).toBe(false)
        }
        await expect
            .poll(async () => (await state(request)).lateWrites)
            .toBeGreaterThan(0)
        const observed = await state(request)
        expect(observed.rejectedWrites).toBe(
            mode === 'generation' ? observed.lateWrites : 0
        )
        if (mode === 'generation') {
            const before = await request.get(
                `${origin}/__test/publication/state`,
                { headers: auth }
            )
            expect(before.status()).toBe(200)
            const received = (await before.json()).received
            const repeat = await request.get(article, { headers: marked })
            expect(repeat.status()).toBe(200)
            expect(await repeat.text()).toContain('PUBLICATION_END_V2')
            const reused = await state(request)
            const bodyLookups = reused.lookups.filter(
                (lookup) =>
                    lookup.resource === 'body' && lookup.generation === 2
            )
            const key = bodyLookups.find(
                (lookup) => lookup.requestId === 2
            )?.keyHash
            expect(key).toBeTruthy()
            expect(
                bodyLookups.some(
                    (lookup) =>
                        lookup.requestId === 3 &&
                        lookup.phase === 'end' &&
                        lookup.hit === true &&
                        lookup.keyHash === key
                )
            ).toBe(true)
            const after = await request.get(
                `${origin}/__test/publication/state`,
                { headers: auth }
            )
            expect(after.status()).toBe(200)
            expect((await after.json()).received).toBe(received)
        }
    } catch (error) {
        bodyErrors.push(error)
        throw error
    } finally {
        await cleanupExperiment(request, pending, bodyErrors)
    }
}

test('baseline: late V1 write remains visible after publication', async ({
    request,
}) => {
    await race(request, 'baseline', false)
})
test('generation after-drain: B must receive V2 without a second webhook', async ({
    request,
}) => {
    await race(request, 'generation', false)
})
test('generation overlapping: B starts while A is held and must receive V2', async ({
    request,
}) => {
    await race(request, 'generation', true)
})
test('revision may repeat but generation cannot roll back or accept stale publishers', () => {
    const session = createGenerationSession('generation')
    const first = session.current()
    expect(session.advance(1, 'r2')).toEqual({ generation: 2, revision: 'r2' })
    expect(session.advance(1, 'r1')).toBeNull()
    expect(session.advance(2, 'r1')).toEqual({ generation: 3, revision: 'r1' })
    expect(first).toEqual({ generation: 1, revision: 'r1' })
    expect(session.keyFor('synthetic-key', first)).toBe(
        session.keyFor('synthetic-key', first)
    )
    expect(session.keyFor('synthetic-key', first)).not.toBe(
        session.keyFor('synthetic-key', session.current())
    )
    expect(session.canWrite(first)).toBe(false)
})

test('negative control: a new generation alone cannot certify the origin revision', async ({
    request,
}) => {
    const bodyErrors: unknown[] = []
    try {
        await control(request, 'reset')
        await invalidate(request)
        await reset(request, 'generation')
        // Deliberately violate publish-before-switch: the origin is still V1.
        const advanced = await request.post(
            '/__test/cache-generation/advance-r2',
            {
                headers: { ...auth, 'x-expected-generation': '1' },
            }
        )
        expect(advanced.status()).toBe(200)
        expect(await advanced.json()).toMatchObject({
            generation: 2,
            revision: 'r2',
        })
        const response = await request.get(article, { headers: marked })
        expect(response.status()).toBe(200)
        const html = await response.text()
        expect(html.includes('PUBLICATION_END_V1')).toBe(true)
        expect(html.includes('PUBLICATION_END_V2')).toBe(false)
    } catch (error) {
        bodyErrors.push(error)
        throw error
    } finally {
        await cleanupExperiment(request, [], bodyErrors)
    }
})

test('experiment controls reject unauthenticated and stale generation changes', async ({
    request,
}) => {
    const denied = await request.post(
        '/__test/cache-generation/reset-generation'
    )
    expect(denied.status()).toBe(401)
    const bodyErrors: unknown[] = []
    try {
        await reset(request, 'generation')
        const change = (expected: number, revision: 'r1' | 'r2') =>
            request.post(`/__test/cache-generation/advance-${revision}`, {
                headers: { ...auth, 'x-expected-generation': String(expected) },
            })
        expect((await change(1, 'r2')).status()).toBe(200)
        expect((await change(1, 'r1')).status()).toBe(409)
        expect(await state(request)).toMatchObject({
            generation: 2,
            revision: 'r2',
        })
        expect((await change(2, 'r1')).status()).toBe(200)
        expect(await state(request)).toMatchObject({
            generation: 3,
            revision: 'r1',
        })
    } catch (error) {
        bodyErrors.push(error)
        throw error
    } finally {
        await cleanupExperiment(request, [], bodyErrors)
    }
})

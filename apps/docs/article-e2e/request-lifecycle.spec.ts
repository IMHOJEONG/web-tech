import assert from 'node:assert/strict'
import { createServer, get } from 'node:http'
import { test } from '@playwright/test'
import { RequestLifecycle, type LifecycleSummary } from './request-lifecycle.ts'
import {
    bindResponseObservation,
    observeRequest,
    withRequestObservation,
    currentRequestObservation,
} from './request-lifecycle-observer.ts'

test('lifecycle: finish then close counts as one completed response', () => {
    const state = new RequestLifecycle('/ko/docs', 'GET', {})
    state.finish(200, true)
    state.close(200, true)
    state.close(200, true)
    const result = state.snapshot()
    assert.equal(result.outcome, 'completed')
    assert.equal(result.closeBeforeFinish, false)
    assert.equal(result.transportClosed, null)
    assert.deepEqual(
        result.events.map((event) => event.event),
        ['started', 'finished', 'closed']
    )
})

test('lifecycle: partial coverage and prefetch cannot prove cancellation', () => {
    const state = new RequestLifecycle('/ko/docs', 'GET', {
        'next-router-prefetch': '1',
    })
    state.controlledCancel()
    state.close(200, false)
    const result = state.snapshot()
    assert.equal(result.outcome, 'unknown')
    assert.equal(result.statusCode, null)
    assert.equal(result.reason, 'prefetch-cancellation-suspected')
})

test('lifecycle: late render error overrides finish and cancellation', () => {
    const state = new RequestLifecycle('/ko/docs', 'GET', {}, 'complete')
    state.controlledCancel()
    state.finish(200, true)
    state.close(200, true)
    const id = state.error('render', '336358438')
    const result = state.snapshot()
    assert.equal(result.outcome, 'failed')
    assert.equal(result.statusCode, 200)
    assert.equal(result.events.at(-1)?.errorId, id)
    assert.deepEqual(result.precedingErrorIds, [])
})

test('lifecycle: recovered timeout is degraded, missing completion remains unknown', () => {
    const state = new RequestLifecycle('/ko/docs', 'GET', {})
    const id = state.error('timeout')
    assert.equal(state.snapshot().outcome, 'failed')
    state.recover(id)
    assert.equal(state.snapshot().outcome, 'unknown')
    state.finish(200, true)
    assert.equal(state.snapshot().outcome, 'degraded')
})

test('lifecycle: redacts input and bounds storage without masking lost errors', () => {
    const state = new RequestLifecycle(
        '/ko/docs/private-secret?q=query-secret',
        'CUSTOM-secret',
        {
            authorization: 'secret-token',
            cookie: 'secret-cookie',
            'next-router-segment-prefetch': 'secret-segment',
            'x-request-id': 'secret-id',
        },
        'complete'
    )
    for (let index = 0; index < 40; index++)
        state.error('stream', 'secret\nvalue')
    state.finish(200, true)
    state.close(200, true)
    const result = state.snapshot()
    assert.equal(result.events.length, 16)
    assert.equal(result.omittedEvents, 27)
    assert.equal(result.outcome, 'unknown')
    assert.equal(result.reason, 'error-buffer-overflow')
    assert.equal(JSON.stringify(result).includes('secret'), false)
    assert.ok(Buffer.byteLength(JSON.stringify(result)) < 8192)
    assert.equal(new Set(result.events.map((event) => event.eventId)).size, 16)
})

test('lifecycle: an unobserved ending is not a success or a fabricated timeout', () => {
    const result = new RequestLifecycle(
        '/unknown/private',
        'GET',
        {}
    ).snapshot()
    assert.equal(result.outcome, 'unknown')
    assert.equal(result.responseFinished, null)
    assert.equal(result.responseClosed, null)
    assert.equal(result.durationMs, null)
    assert.equal(result.path, '[redacted]')
})

test('lifecycle: bounded error history still preserves a subsequent fatal signal', () => {
    const state = new RequestLifecycle('/ko/docs', 'GET', {})
    for (let index = 0; index < 8; index++) state.error('stream')
    state.error('render')
    state.finish(200, true)
    assert.equal(state.snapshot().outcome, 'failed')
})

test('lifecycle: client hints cannot choose or reuse the server request ID', () => {
    const hint = '00000000-0000-4000-8000-000000000000'
    const first = new RequestLifecycle('/ko/docs', 'GET', {
        'x-article-client-probe': hint,
    })
    const second = new RequestLifecycle('/ko/docs', 'GET', {
        'x-article-client-probe': hint,
    })
    assert.equal(first.snapshot().clientProbeId, hint)
    assert.notEqual(first.requestId, hint)
    assert.notEqual(first.requestId, second.requestId)
    assert.equal(
        new RequestLifecycle('/ko/docs', 'GET', {
            'x-article-client-probe': 'not-a-valid-id',
        }).snapshot().clientProbeId,
        null
    )
})

const scenarios = [
    'complete',
    'cancel',
    'disconnect',
    'render',
    'render-after-headers',
    'timeout',
    'recover',
    'http500',
    'sink-failure',
] as const

for (const scenario of scenarios) {
    test(`lifecycle HTTP: ${scenario}`, async () => {
        let resolveClosed!: (summary: LifecycleSummary) => void
        let rejectClosed!: (error: Error) => void
        const closed = new Promise<LifecycleSummary>((resolve, reject) => {
            resolveClosed = resolve
            rejectClosed = reject
        })
        let observation: ReturnType<typeof observeRequest> | undefined
        const server = createServer((request, response) => {
            observation = observeRequest(
                request,
                response,
                (summary) => {
                    if (summary.responseClosed) resolveClosed(summary)
                    if (scenario === 'sink-failure')
                        throw new Error('sink failure')
                },
                'complete'
            )
            bindResponseObservation(response, observation)
            response.once('close', () =>
                assert.equal(currentRequestObservation(), observation)
            )
            withRequestObservation(observation, () => {
                assert.equal(currentRequestObservation(), observation)
                if (scenario === 'render') observation!.error('render')
                if (scenario === 'timeout') observation!.error('timeout')
                if (scenario === 'recover')
                    observation!.recover(observation!.error('upstream'))
                response.statusCode = scenario === 'http500' ? 500 : 200
                response.write('ready')
                if (scenario === 'render-after-headers')
                    observation!.error('render')
                if (
                    ![
                        'cancel',
                        'disconnect',
                        'render',
                        'render-after-headers',
                        'timeout',
                    ].includes(scenario)
                )
                    response.end('complete')
            })
        })
        await new Promise<void>((resolve) =>
            server.listen(0, '127.0.0.1', resolve)
        )
        const address = server.address()
        assert.ok(address && typeof address !== 'string')
        const client = get(
            `http://127.0.0.1:${address.port}/ko/docs?q=never-log-me`,
            {
                headers: { 'next-router-prefetch': '1' },
            }
        )
        client.on('error', (error) => rejectClosed(error))
        client.on('response', (response) => {
            response.on('error', () => {
                /* The test deliberately closes incomplete responses. */
            })
            response.once('data', () => {
                if (scenario === 'cancel') observation!.cancel()
                if (
                    [
                        'cancel',
                        'disconnect',
                        'render',
                        'render-after-headers',
                        'timeout',
                    ].includes(scenario)
                )
                    response.destroy()
            })
            response.resume()
        })
        const timer = setTimeout(
            () => rejectClosed(new Error('Response close was not observed')),
            5000
        )
        try {
            const result = await closed
            assert.equal(result.prefetch, true)
            assert.equal(result.queryPresent, true)
            assert.ok(result.durationMs !== null && result.durationMs >= 0)
            const expected =
                scenario === 'cancel'
                    ? 'cancelled'
                    : scenario === 'disconnect'
                      ? 'unknown'
                      : [
                              'render',
                              'render-after-headers',
                              'timeout',
                              'http500',
                          ].includes(scenario)
                        ? 'failed'
                        : scenario === 'recover'
                          ? 'degraded'
                          : 'completed'
            assert.equal(result.outcome, expected)
            assert.equal(
                result.closeBeforeFinish,
                [
                    'cancel',
                    'disconnect',
                    'render',
                    'render-after-headers',
                    'timeout',
                ].includes(scenario)
            )
            assert.equal(result.responseFinished, !result.closeBeforeFinish)
            assert.equal(JSON.stringify(result).includes('never-log-me'), false)
            if (scenario === 'sink-failure')
                assert.ok(observation!.deliveryFailures() > 0)
            if (scenario === 'render')
                assert.equal(
                    result.events.find((event) => event.event === 'error')
                        ?.phase,
                    'before-headers'
                )
            if (scenario === 'render-after-headers')
                assert.equal(
                    result.events.find((event) => event.event === 'error')
                        ?.phase,
                    'after-headers'
                )
            if (scenario === 'render')
                assert.ok(
                    result.events.findIndex(
                        (event) => event.event === 'error'
                    ) <
                        result.events.findIndex(
                            (event) => event.event === 'closed'
                        )
                )
        } finally {
            clearTimeout(timer)
            client.destroy()
            server.closeAllConnections()
            await new Promise<void>((resolve) => server.close(() => resolve()))
        }
    })
}

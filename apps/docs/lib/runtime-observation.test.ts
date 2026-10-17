import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildRuntimeErrorEvent,
    readRequestId,
    redactPerformanceUrl,
} from './runtime-observation.ts'

test('performance events remove queries, fragments and credentials', () => {
    assert.equal(
        redactPerformanceUrl(
            'https://user:secret@heap-forge.app/ko/docs?q=private#token'
        ),
        'https://heap-forge.app/ko/docs'
    )
    for (const url of [
        'invalid',
        'javascript:alert(1)',
        'https://heap-forge.app/api/push',
        'https://heap-forge.app/ko/lab/demo',
    ]) {
        assert.equal(redactPerformanceUrl(url), null)
    }
})

test('correlation accepts only UUID v4 and absent correlation stays explicit', () => {
    assert.equal(readRequestId('external\nsecret'), null)
    assert.equal(
        readRequestId('cd6e9f64-1190-4e34-8f79-7e8185175327'),
        'cd6e9f64-1190-4e34-8f79-7e8185175327'
    )
    assert.deepEqual(
        buildRuntimeErrorEvent(null, '/[locale]/docs/[...slugParts]', 'render'),
        {
            event: 'request-error',
            requestId: null,
            correlation: 'unavailable',
            route: '/[locale]/docs/[...slugParts]',
            routeType: 'render',
            outcome: 'error',
            durationScope: 'hook-only',
            durationMs: null,
        }
    )
})

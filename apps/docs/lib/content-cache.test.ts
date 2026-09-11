import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidContentRevalidationToken } from './content-cache.ts'

test('accepts an exact bearer revalidation token', () => {
    assert.equal(
        isValidContentRevalidationToken(
            'Bearer revalidation-secret',
            'revalidation-secret'
        ),
        true
    )
})

test('rejects missing and malformed authorization headers', () => {
    assert.equal(isValidContentRevalidationToken(null, 'secret'), false)
    assert.equal(
        isValidContentRevalidationToken('Basic secret', 'secret'),
        false
    )
    assert.equal(
        isValidContentRevalidationToken('Bearer secret extra', 'secret'),
        false
    )
})

test('rejects mismatched or unconfigured tokens', () => {
    assert.equal(
        isValidContentRevalidationToken('Bearer incorrect', 'secret'),
        false
    )
    assert.equal(
        isValidContentRevalidationToken('Bearer secret', undefined),
        false
    )
})

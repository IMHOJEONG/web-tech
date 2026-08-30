import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldShowContentSourceBadge } from './content-source-visibility.ts'

test('shouldShowContentSourceBadge returns true only in development', () => {
    assert.equal(shouldShowContentSourceBadge('development'), true)
    assert.equal(shouldShowContentSourceBadge('production'), false)
    assert.equal(shouldShowContentSourceBadge('test'), false)
    assert.equal(shouldShowContentSourceBadge(undefined), false)
})

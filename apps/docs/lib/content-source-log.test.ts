import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveCollectionContentSource } from './content-source-log.ts'

test('resolveCollectionContentSource returns mixed when both sources have docs', () => {
    assert.equal(resolveCollectionContentSource(2, 1), 'mixed')
})

test('resolveCollectionContentSource returns remote when only remote has docs', () => {
    assert.equal(resolveCollectionContentSource(0, 1), 'remote')
})

test('resolveCollectionContentSource returns local when only local has docs', () => {
    assert.equal(resolveCollectionContentSource(1, 0), 'local')
})

test('resolveCollectionContentSource returns none when no source has docs', () => {
    assert.equal(resolveCollectionContentSource(0, 0), 'none')
})

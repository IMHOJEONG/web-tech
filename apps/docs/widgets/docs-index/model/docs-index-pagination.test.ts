import assert from 'node:assert/strict'
import test from 'node:test'
import { clampPage, getPaginationRange } from './docs-index-pagination.ts'

test('clampPage keeps page inside available bounds', () => {
    assert.equal(clampPage(0, 4), 1)
    assert.equal(clampPage(10, 4), 4)
    assert.equal(clampPage(2.8, 4), 2)
})

test('getPaginationRange returns visible range and slice start', () => {
    assert.deepEqual(
        getPaginationRange({
            currentPage: 2,
            pageSize: 8,
            totalCount: 18,
        }),
        {
            page: 2,
            pageSize: 8,
            startIndex: 8,
            totalPages: 3,
            rangeStart: 9,
            rangeEnd: 16,
        }
    )
})

test('getPaginationRange handles empty result sets', () => {
    assert.deepEqual(
        getPaginationRange({
            currentPage: 3,
            pageSize: 8,
            totalCount: 0,
        }),
        {
            page: 1,
            pageSize: 8,
            startIndex: 0,
            totalPages: 1,
            rangeStart: 0,
            rangeEnd: 0,
        }
    )
})

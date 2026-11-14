import assert from 'node:assert/strict'
import test from 'node:test'
import {
    findActiveHeading,
    getHeadingId,
} from '../widgets/article-toc/model/active-heading.ts'

test('heading IDs preserve numbered and percent-encoded anchors', () => {
    assert.equal(getHeadingId('#1-2-compress'), '1-2-compress')
    assert.equal(getHeadingId('#%EB%AA%A9%EC%B0%A8'), '목차')
    assert.equal(getHeadingId('#100%25'), '100%')
})

test('invalid fragment escapes do not crash TOC navigation', () => {
    for (const href of ['#', '#%E0%A4%A', '/docs', 'https://example.test']) {
        assert.equal(getHeadingId(href), null)
    }
})

const positions = [
    { href: '#intro', top: 120 },
    { href: '#nested', top: 300 },
    { href: '#last', top: 1000 },
]

test('empty TOC has no active heading', () => {
    assert.equal(findActiveHeading([], 0), null)
    assert.equal(findActiveHeading([], 0, true), null)
})

test('reading line follows heading boundaries in either scroll direction', () => {
    for (const [line, expected] of [
        [0, '#intro'],
        [120, '#intro'],
        [299, '#intro'],
        [300, '#nested'],
        [999, '#nested'],
        [1000, '#last'],
        [1500, '#last'],
        [200, '#intro'],
    ] as const) {
        assert.equal(findActiveHeading(positions, line), expected)
    }
})

test('document bottom activates the last section even when it is short', () => {
    assert.equal(findActiveHeading(positions, 900, true), '#last')
})

test('large heading indexes remain ordered and are not mutated', () => {
    const headings = Array.from({ length: 1000 }, (_, i) => ({
        href: `#part-${i}`,
        top: i * 100,
    }))
    const before = structuredClone(headings)
    assert.equal(findActiveHeading(headings, 54321), '#part-543')
    assert.deepEqual(headings, before)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { createArticleTiming } from './article-timing.ts'
import type { ArticleTimingEvent } from './article-timing.types.ts'

test('records stages with a shared trace without recording content', async () => {
    const events: ArticleTimingEvent[] = []
    let clock = 0
    const measure = createArticleTiming(
        (event) => events.push(event),
        () => clock
    )
    const result = await measure('document-select', () => {
        clock = 12.345
        return { content: 'private body', token: 'secret' }
    })
    await measure('content-render', async () => 'html')
    assert.equal(result.content, 'private body')
    const [first, second] = events
    assert.ok(first)
    assert.ok(second)
    assert.equal(first.durationMs, 12.35)
    assert.equal(first.outcome, 'success')
    assert.equal(first.traceId, second.traceId)
    assert.ok(!JSON.stringify(events).includes('secret'))
    assert.ok(!JSON.stringify(events).includes('private body'))
})

test('preserves original failure and emits only a generic outcome', async () => {
    const events: ArticleTimingEvent[] = []
    const measure = createArticleTiming((event) => events.push(event))
    const error = new Error('sensitive error')
    await assert.rejects(
        measure('content-render', () => {
            throw error
        }),
        (actual) => actual === error
    )
    assert.equal(events[0]?.outcome, 'error')
    assert.ok(!JSON.stringify(events).includes('sensitive'))
})

test('a broken logger cannot break rendering', async () => {
    const measure = createArticleTiming(() => {
        throw new Error('logger')
    })
    assert.equal(await measure('navigation-load', () => 42), 42)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    isOfflineInputWithinBudget,
    OFFLINE_INPUT_MAX_BYTES,
} from '../feature/offline/model/offline-input-budget.ts'

function paragraph(unit: string, bytes: number): string {
    const bodyBytes = bytes - Buffer.byteLength('<p></p>', 'utf8')
    const unitBytes = Buffer.byteLength(unit, 'utf8')
    return `<p>${unit.repeat(Math.floor(bodyBytes / unitBytes))}${'a'.repeat(bodyBytes % unitBytes)}</p>`
}

for (const { name, unit } of [
    { name: 'ASCII', unit: 'a' },
    { name: 'Korean', unit: '가' },
    { name: 'emoji', unit: '🙂' },
]) {
    for (const delta of [-1, 0, 1]) {
        test(`${name} raw HTML at 1MiB ${delta >= 0 ? '+' : ''}${delta} bytes`, () => {
            const bytes = OFFLINE_INPUT_MAX_BYTES + delta
            const html = paragraph(unit, bytes)
            assert.equal(Buffer.byteLength(html, 'utf8'), bytes)
            assert.equal(isOfflineInputWithinBudget(html), delta <= 0)
        })
    }
}

test('rejects the audited Korean input despite its short code-unit length', () => {
    const html = `<p>${'가'.repeat(400_000)}</p>`
    assert.equal(html.length, 400_007)
    assert.equal(Buffer.byteLength(html, 'utf8'), 1_200_007)
    assert.equal(isOfflineInputWithinBudget(html), false)
})

test('counts markup and attributes, not just visible text', () => {
    const text = 'a'.repeat(OFFLINE_INPUT_MAX_BYTES - 7)
    assert.equal(isOfflineInputWithinBudget(`<p>${text}</p>`), true)
    assert.equal(
        isOfflineInputWithinBudget(`<p title="extra">${text}</p>`),
        false
    )
})

test('counts a lone surrogate as its UTF-8 replacement without changing the input', () => {
    const exact = 'a'.repeat(OFFLINE_INPUT_MAX_BYTES - 3) + '\uD800'
    assert.equal(Buffer.byteLength(exact, 'utf8'), OFFLINE_INPUT_MAX_BYTES)
    assert.equal(isOfflineInputWithinBudget(exact), true)
    assert.equal(isOfflineInputWithinBudget(exact + 'a'), false)
    assert.equal(exact.at(-1), '\uD800')
})

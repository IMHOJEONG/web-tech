import assert from 'node:assert/strict'
import test from 'node:test'
import { slugifyHeading } from './slugify-heading.ts'

test('heading text supports strings, numbers, arrays and nested element props', () => {
    assert.equal(slugifyHeading('Hello World'), 'hello-world')
    assert.equal(slugifyHeading(42), '42')
    assert.equal(
        slugifyHeading(['Hello', { props: { children: 'World' } }]),
        'hello-world'
    )
    assert.equal(
        slugifyHeading({ props: { children: ['한글', '제목'] } }),
        '한글-제목'
    )
})

test('unknown heading input does not assume props has an object shape', () => {
    for (const value of [
        null,
        undefined,
        {},
        { props: null },
        { props: 42 },
        { props: 'text' },
        { props: {} },
    ]) {
        assert.equal(slugifyHeading(value), '')
    }
})

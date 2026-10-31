import assert from 'node:assert/strict'
import test from 'node:test'
import { hasDocumentThumbnail } from '../shared/assets/default-thumbnails.ts'

test('editorial lists omit missing and default thumbnail artwork', () => {
    for (const thumbnail of [
        undefined,
        null,
        '',
        '  ',
        '/default/no-image.webp',
        '/default/local-document.svg',
        'https://example.test/default/local-document.svg?v=2',
    ]) {
        assert.equal(hasDocumentThumbnail(thumbnail), false)
    }
})

test('editorial lists keep actual local and remote article images', () => {
    for (const thumbnail of [
        '/diagrams/runtime.png',
        'https://assets.example.test/web/cover.webp',
    ]) {
        assert.equal(hasDocumentThumbnail(thumbnail), true)
    }
})

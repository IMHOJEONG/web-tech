import assert from 'node:assert/strict'
import test from 'node:test'
import { getCalloutLabel, getCalloutVariantFromText } from './callout.ts'

test('getCalloutVariantFromText detects supported markdown callout markers', () => {
    assert.equal(
        getCalloutVariantFromText('[!NOTE] Keep this in mind.'),
        'note'
    )
    assert.equal(getCalloutVariantFromText('[!TIP] Try this first.'), 'tip')
    assert.equal(
        getCalloutVariantFromText('[!WARNING] Check the fallback.'),
        'warning'
    )
})

test('getCalloutVariantFromText ignores unsupported or non-leading markers', () => {
    assert.equal(getCalloutVariantFromText('Just a blockquote.'), null)
    assert.equal(getCalloutVariantFromText('Text before [!NOTE] marker.'), null)
    assert.equal(getCalloutVariantFromText('[!INFO] Unsupported marker.'), null)
})

test('getCalloutLabel returns fixed display labels', () => {
    assert.equal(getCalloutLabel('note'), 'NOTE')
    assert.equal(getCalloutLabel('tip'), 'TIP')
    assert.equal(getCalloutLabel('warning'), 'WARNING')
})

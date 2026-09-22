import assert from 'node:assert/strict'
import test from 'node:test'
import { isLocale, localizePath, stripLocale } from '../i18n/locale-path.ts'

test('locale prefixes preserve query/hash and do not change external links', () => {
    assert.equal(
        localizePath('/docs?q=react#results', 'ko'),
        '/ko/docs?q=react#results'
    )
    assert.equal(localizePath('/en/docs', 'ko'), '/ko/docs')
    assert.equal(localizePath('/', 'en'), '/en')
    assert.equal(
        localizePath('https://example.com/a', 'ko'),
        'https://example.com/a'
    )
    assert.equal(localizePath('//example.com/a', 'ko'), '//example.com/a')
    assert.equal(stripLocale('/ko/category/web'), '/category/web')
    assert.equal(stripLocale('/korea'), '/korea')
    assert.equal(isLocale('fr'), false)
})

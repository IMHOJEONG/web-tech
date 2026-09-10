import assert from 'node:assert/strict'
import test from 'node:test'
import {
    sanitizeRemoteHtml,
    stripHtmlToCodeText,
    stripHtmlToText,
} from './remote-html-sanitizer.ts'

test('sanitizeRemoteHtml blocks executable markup hidden across comment boundaries', () => {
    const sanitized = sanitizeRemoteHtml(`
        <scr<!-- -->ipt>alert('comment-boundary')</script>
        <p>Safe content</p>
    `)

    assert.doesNotMatch(sanitized, /<script/i)
    assert.doesNotMatch(sanitized, /<!--/)
    assert.doesNotMatch(sanitized, /comment-boundary/)
    assert.match(sanitized, /<p>Safe content<\/p>/)
})

test('sanitizeRemoteHtml keeps the allowlist and rejects unsafe attributes and URLs', () => {
    const sanitized = sanitizeRemoteHtml(`
        <a href="javascript:alert(1)" onclick="alert(1)">Unsafe</a>
        <a href="https://heap-forge.app" target="_blank">Safe</a>
        <img src="https://assets.heap-forge.app/safe.webp" onerror="alert(1)" alt="safe">
    `)

    assert.doesNotMatch(sanitized, /javascript:/i)
    assert.doesNotMatch(sanitized, /on(?:click|error)=/i)
    assert.match(
        sanitized,
        /<a href="https:\/\/heap-forge\.app" target="_blank" rel="noopener noreferrer">Safe<\/a>/
    )
    assert.match(
        sanitized,
        /<img src="https:\/\/assets\.heap-forge\.app\/safe\.webp" alt="safe" \/>/
    )
})

test('plain and code text extraction cannot reconstruct executable markup', () => {
    const craftedHtml = `<scr<!-- -->ipt>alert('text-boundary')</script><strong>Safe</strong>`

    for (const text of [
        stripHtmlToText(craftedHtml),
        stripHtmlToCodeText(craftedHtml),
    ]) {
        assert.doesNotMatch(text, /<script/i)
        assert.doesNotMatch(text, /<!--/)
        assert.match(text, /Safe/)
    }
})

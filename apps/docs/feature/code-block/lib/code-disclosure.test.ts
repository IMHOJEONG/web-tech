import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getCodeDisclosure,
    getCodeDisclosureSummary,
} from './code-disclosure.ts'
import { normalizeRemoteArticleHtml } from '../../../widgets/article-detail/model/normalize-remote-article-html.ts'

test('only code beyond twenty lines collapses and the preview has ten lines', () => {
    const short = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n')
    assert.equal(getCodeDisclosure(short).collapsible, false)
    const long = `${short}\nlast`
    const disclosure = getCodeDisclosure(long)
    assert.equal(disclosure.collapsible, true)
    assert.equal(disclosure.lineCount, 21)
    assert.equal(disclosure.preview.split('\n').length, 10)
    assert.equal(disclosure.preview.includes('last'), false)
})

test('line counting handles CRLF, empty content and one terminal newline', () => {
    assert.equal(getCodeDisclosure('').lineCount, 0)
    assert.equal(getCodeDisclosure('a\r\nb\r\n').lineCount, 2)
    assert.equal(getCodeDisclosure('a\nb\n\n').lineCount, 3)
    assert.equal(getCodeDisclosure('a\nb\n').preview, 'a\nb')
    assert.match(getCodeDisclosureSummary(21), /21줄/)
    assert.match(getCodeDisclosureSummary(21), /21 lines/)
})

test('remote long code uses native details with full code before a safe preview', () => {
    const lines = Array.from({ length: 23 }, (_, i) => `const line${i} = ${i};`)
    lines[0] = 'const tag = "&lt;script&gt;";'
    const result = normalizeRemoteArticleHtml(
        `<pre><code class="language-js">${lines.join('\n')}\n</code></pre>`
    )
    assert.match(result.content, /mdx-code-frame--collapsible/)
    assert.match(
        result.content,
        /<details class="mdx-code-disclosure"><summary>/
    )
    assert.doesNotMatch(result.content, /<details[^>]*\bopen(?:\s|=|>)/)
    assert.ok(
        result.content.indexOf('line22') <
            result.content.indexOf('mdx-code-preview')
    )
    assert.doesNotMatch(result.content.split('mdx-code-preview')[1]!, /line22/)
    assert.doesNotMatch(result.content, /<script>/)
    assert.match(result.content, /mdx-code-token--keyword/)
    assert.match(result.content, /mdx-code-frame__language">JS/)
})

test('remote short code stays expanded with one pre and no disclosure', () => {
    const result = normalizeRemoteArticleHtml(
        '<pre><code>hello\nworld</code></pre>'
    )
    assert.doesNotMatch(result.content, /<details/)
    assert.equal((result.content.match(/<pre/g) ?? []).length, 1)
})

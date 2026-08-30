import assert from 'node:assert/strict'
import test from 'node:test'
import { highlightCode } from './highlight-code.ts'

test('highlightCode escapes raw html before inserting token spans', () => {
    const html = highlightCode(
        '<img src=x onerror="alert(1)">\n<script>alert("xss")</script>',
        'html'
    )

    assert.doesNotMatch(html, /<img/i)
    assert.doesNotMatch(html, /<script/i)
    assert.match(html, /mdx-code-token--punctuation">&lt;<\/span>/)
    assert.match(html, /mdx-code-token--tag">script<\/span>/)
    assert.match(html, /mdx-code-token--tag/)
    assert.match(html, /mdx-code-token--attribute/)
})

test('highlightCode tokenizes escaped html tags from sanitized remote code', () => {
    const html = highlightCode(
        '&lt;canvas layoutsubtree&gt;\n  &lt;button&gt;click me&lt;/button&gt;\n&lt;/canvas&gt;',
        'html'
    )

    assert.doesNotMatch(html, /<canvas/i)
    assert.match(html, /mdx-code-token--punctuation">&amp;lt;<\/span>/)
    assert.match(html, /mdx-code-token--tag">canvas<\/span>/)
    assert.match(html, /mdx-code-token--attribute">layoutsubtree<\/span>/)
    assert.match(html, /mdx-code-token--tag">button<\/span>/)
})

test('highlightCode highlights js keywords strings numbers and comments', () => {
    const html = highlightCode(
        'const answer = 42\n// explain\nreturn "ready"',
        'js'
    )

    assert.match(html, /mdx-code-token--keyword">const<\/span>/)
    assert.match(html, /mdx-code-token--number">42<\/span>/)
    assert.match(html, /mdx-code-token--comment">\/\/ explain<\/span>/)
    assert.match(html, /mdx-code-token--keyword">return<\/span>/)
    assert.match(html, /mdx-code-token--string">&quot;ready&quot;<\/span>/)
})

test('highlightCode highlights css properties and values', () => {
    const html = highlightCode('.card { color: #f97316; margin: 1rem; }', 'css')

    assert.match(html, /mdx-code-token--property">color<\/span>/)
    assert.match(html, /mdx-code-token--number">#f97316<\/span>/)
    assert.match(html, /mdx-code-token--property">margin<\/span>/)
    assert.match(html, /mdx-code-token--number">1rem<\/span>/)
})

test('highlightCode escapes unsupported languages without tokenizing', () => {
    const html = highlightCode('<raw value="1">', 'txt')

    assert.equal(html, '&lt;raw value=&quot;1&quot;&gt;')
})

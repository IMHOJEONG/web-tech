import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeHTML } from 'entities'
import { highlightCode } from './highlight-code.ts'
import { stripHtmlToCodeText } from '../../../lib/remote-html-sanitizer.ts'
import { normalizeRemoteArticleHtml } from '../../../widgets/article-detail/model/normalize-remote-article-html.ts'

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

const diff = [
    'if (max_block_type <= 1) {',
    '-    return BROTLI_FALSE;',
    '+    return BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH;',
    '}',
].join('\n')

for (const language of ['diff', 'patch', ' DIFF ']) {
    test(`${language}: diff lines retain markers, whitespace and source text`, () => {
        const source = `${diff}\r\n\r\n+<script>alert("x")</script>\r\n`
        const html = highlightCode(source, language)
        assert.match(html, /mdx-code-diff-line--removed">- {4}return/)
        assert.match(html, /mdx-code-diff-line--added">\+ {4}return/)
        assert.match(html, /mdx-code-diff-line--context/)
        assert.doesNotMatch(html, /<script/i)
        assert.equal(decodeHTML(html.replace(/<\/?span\b[^>]*>/g, '')), source)
    })
}

test('patch headers and hunk metadata are not additions or deletions', () => {
    for (const line of [
        'diff --git a/file b/file',
        'index 123..456 100644',
        '--- a/file',
        '+++ b/file',
        '@@ -1,2 +1,2 @@',
        '\\ No newline at end of file',
    ]) {
        const html = highlightCode(line, 'diff')
        assert.match(html, /mdx-code-diff-line--meta/)
        assert.doesNotMatch(html, /mdx-code-diff-line--(?:added|removed)/)
        assert.equal(stripHtmlToCodeText(html), line)
    }
    assert.equal(highlightCode('', 'diff'), '')
})

test('ordinary code and unspecified language never infer diff from operators', () => {
    for (const language of ['ts', 'js', 'text', 'code', 'c']) {
        assert.doesNotMatch(highlightCode(diff, language), /mdx-code-diff-line/)
    }
})

test('remote diff blocks and their folded preview use the shared highlighting', () => {
    const source = [
        diff,
        ...Array.from({ length: 24 }, (_, i) => `+line ${i}`),
    ].join('\n')
    const encoded = source
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    const { content } = normalizeRemoteArticleHtml(
        `<pre><code class="language-diff">${encoded}</code></pre>`
    )
    assert.match(content, /mdx-code-frame--collapsible/)
    const blocks = [...content.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/g)]
    assert.equal(blocks.length, 2)
    assert.equal(stripHtmlToCodeText(blocks[0]![1]!), source)
    for (const block of blocks) {
        assert.match(block[1]!, /mdx-code-diff-line--added/)
        assert.match(block[1]!, /mdx-code-diff-line--removed/)
    }
})

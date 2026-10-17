import assert from 'node:assert/strict'
import test from 'node:test'
import { getCodeCopyLabels } from './code-copy-labels.ts'
import {
    getCodeDisclosure,
    getCodeDisclosureSummary,
} from './code-disclosure.ts'
import { normalizeRemoteArticleHtml } from '../../../widgets/article-detail/model/normalize-remote-article-html.ts'
import { stripHtmlToCodeText } from '../../../lib/remote-html-sanitizer.ts'

const SCRIPT_TAG_TEST_PATTERN = /<\/?script\b/i

test('script tag assertions reject mixed case, attributes and whitespace', () => {
    for (const markup of [
        '<script>',
        '<SCRIPT>',
        '<ScRiPt data-test="case">',
        '<script\nsrc="/not-fetched.js">',
        '<script\ttype="text/javascript">',
        '</ScRiPt >',
        '</script data-test="close">',
    ]) {
        assert.match(markup, SCRIPT_TAG_TEST_PATTERN)
    }
})

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
    assert.doesNotMatch(result.content, SCRIPT_TAG_TEST_PATTERN)
    assert.match(result.content, /mdx-code-token--keyword/)
    assert.match(
        result.content,
        /mdx-code-disclosure__language" aria-hidden="true">js/
    )
})

test('remote full code and preview escape script examples without losing code text', () => {
    for (const markup of [
        '<script>alert(1)</script>',
        '<SCRIPT>alert(1)</SCRIPT>',
        '<ScRiPt data-test="case">alert(1)</sCrIpT>',
        '<script\nsrc="/not-fetched.js"></script>',
        '<script\ttype="text/javascript">alert(1)</script >',
        '<script>alert(1)</script data-test="close">',
    ]) {
        const code = [
            `const example = ${JSON.stringify(markup)};`,
            ...Array.from({ length: 22 }, (_, i) => `const line${i} = ${i};`),
        ].join('\n')
        const encoded = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        for (const language of ['js', 'text']) {
            const { content } = normalizeRemoteArticleHtml(
                `<pre><code class="language-${language}">${encoded}</code></pre>`
            )
            assert.doesNotMatch(content, SCRIPT_TAG_TEST_PATTERN)
            assert.match(content, /mdx-code-frame--collapsible/)
            assert.match(content, /mdx-code-preview/)
            const fullCode = content.match(
                /<pre class="mdx-code-block"><code[^>]*>([\s\S]*?)<\/code><\/pre>/
            )?.[1]
            assert.notEqual(fullCode, undefined)
            assert.equal(stripHtmlToCodeText(fullCode!), code)
        }
    }
})

test('shared copy labels cover every state in Korean and English', () => {
    assert.deepEqual(getCodeCopyLabels('en'), {
        idle: { text: 'Copy', announcement: 'Copy code' },
        copied: { text: 'Copied', announcement: 'Code copied' },
        error: { text: 'Copy failed', announcement: 'Failed to copy code' },
    })
    assert.equal(
        getCodeCopyLabels('ko').copied.announcement,
        '코드가 복사되었습니다'
    )
    assert.equal(getCodeCopyLabels('ko').error.text, '복사 실패')
})

test('footer language is escaped before local or remote HTML insertion', () => {
    const summary = getCodeDisclosureSummary(
        28,
        '<img src=x onerror="alert(1)">'
    )
    assert.doesNotMatch(summary, /<img/)
    assert.match(summary, /&lt;img/)
    assert.match(summary, /&quot;alert\(1\)&quot;/)
})

test('remote short code stays expanded with one pre and no disclosure', () => {
    const result = normalizeRemoteArticleHtml(
        '<pre><code>hello\nworld</code></pre>'
    )
    assert.doesNotMatch(result.content, /<details/)
    assert.equal((result.content.match(/<pre/g) ?? []).length, 1)
})

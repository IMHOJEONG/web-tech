import assert from 'node:assert/strict'
import test from 'node:test'
import { Fragment, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { normalizeRemoteContent } from './content-api-html.ts'
import { renderArticleContent } from './render-article-content.ts'

test('renderArticleContent normalizes remote html content and extracts toc', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content: `
            <h1>Local Network Access</h1>
            <p>Intro</p>
            <h2 id="reference">Reference</h2>
        `,
    })

    assert.equal(rendered.mode, 'html')
    assert.equal(rendered.toc.length, 2)
    assert.equal(rendered.toc[0]?.href, '#local-network-access')
    assert.equal(rendered.toc[1]?.href, '#reference')
    assert.match(rendered.content, /id="local-network-access"/)
})

test('renderArticleContent normalizes remote html code blocks to shared code frame', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content: `
            <h2>Example</h2>
            <pre><code class="language-js">const answer = 42;</code></pre>
        `,
    })

    assert.equal(rendered.mode, 'html')
    assert.match(rendered.content, /class="mdx-code-frame"/)
    assert.match(rendered.content, /class="mdx-code-block"/)
    assert.match(rendered.content, /class="mdx-code-frame__language">JS/)
    assert.match(rendered.content, /mdx-code-token--keyword">const/)
    assert.match(rendered.content, /mdx-code-token--number">42/)
})

test('renderArticleContent normalizes remote html tables and blockquotes to shared article contract', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content: `
            <h2>Comparison</h2>
            <blockquote><p>Prefer stable output contracts.</p></blockquote>
            <table>
                <thead><tr><th>Source</th><th>Renderer</th></tr></thead>
                <tbody><tr><td>remote</td><td>html</td></tr></tbody>
            </table>
        `,
    })

    assert.equal(rendered.mode, 'html')
    assert.match(rendered.content, /class="mdx-blockquote"/)
    assert.match(rendered.content, /class="mdx-table-scroll"/)
    assert.match(rendered.content, /role="region"/)
    assert.match(rendered.content, /<table class="mdx-table">/)
})

test('renderArticleContent normalizes remote html callouts to shared article contract', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content: `
            <h2>Operational note</h2>
            <blockquote><p>[!WARNING] Remote rendering should stay bounded.</p></blockquote>
        `,
    })

    assert.equal(rendered.mode, 'html')
    assert.match(rendered.content, /class="mdx-callout mdx-callout--warning"/)
    assert.match(rendered.content, /class="mdx-callout__label">WARNING/)
    assert.match(rendered.content, /Remote rendering should stay bounded\./)
    assert.doesNotMatch(rendered.content, /\[!WARNING\]/)
})

test('renderArticleContent keeps sanitized remote html safe while highlighting escaped code', async () => {
    const normalizedRemoteContent = normalizeRemoteContent(
        `
            <h2><script>alert("heading")</script>Safe Heading</h2>
            <pre><code class="language-html">&lt;script&gt;alert("code")&lt;/script&gt;</code></pre>
        `,
        'text/html'
    )

    assert.ok(normalizedRemoteContent)

    const rendered = await renderArticleContent(normalizedRemoteContent)

    assert.equal(rendered.mode, 'html')
    assert.equal(rendered.toc[0]?.value, 'Safe Heading')
    assert.doesNotMatch(rendered.content, /<script/i)
    assert.doesNotMatch(rendered.content, /alert\("heading"\)/)
    assert.match(rendered.content, /mdx-code-token--tag">script/)
    assert.match(rendered.content, /alert\(&quot;code&quot;\)/)
})

test('renderArticleContent renders mdx content and exposes toc data', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'mdx',
        content: `# Heap Forge\n\n## Search Ranking\n\nWeighted search improves discovery.`,
    })

    assert.equal(rendered.mode, 'mdx')
    assert.equal(rendered.toc?.length, 1)
    assert.equal(rendered.toc?.[0]?.value, 'Search Ranking')

    const markup = renderToStaticMarkup(
        createElement(Fragment, null, rendered.content)
    )

    assert.match(markup, /Heap Forge/)
    assert.match(markup, /Search Ranking/)
    assert.match(markup, /Weighted search improves discovery\./)
})

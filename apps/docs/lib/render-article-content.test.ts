import assert from 'node:assert/strict'
import test from 'node:test'
import { Fragment, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
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

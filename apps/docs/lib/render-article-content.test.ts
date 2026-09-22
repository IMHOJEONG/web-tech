import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Fragment, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { normalizeRemoteContent } from './content-api-html.ts'
import { renderArticleContent } from './render-article-content.ts'

for (const [name, content, hasTitle] of [
    ['markdown h1', '# Existing title\n\n## Body', true],
    ['setext h1', 'Existing title\n==============\n\n## Body', true],
    ['jsx h1', '<h1>Existing title</h1>\n\n## Body', true],
    ['frontmatter only', '---\ntitle: Metadata title\n---\n\n## Body', false],
    ['fenced heading', '```md\n# Not a title\n```\n\n## Body', false],
    ['fenced html', '```html\n<h1>Example</h1>\n```', false],
] as const) {
    test(`article title detection: ${name}`, async () => {
        const rendered = await renderArticleContent(
            { contentFormat: 'mdx', content },
            { codeHighlight: false }
        )
        assert.equal(rendered.hasTitle, hasTitle)
        const markup = renderToStaticMarkup(
            createElement(Fragment, null, rendered.content)
        )
        assert.equal(/<h1(?:\s|>)/.test(markup), hasTitle)
    })
}

test('remote title detection preserves h1 but excludes escaped code', async () => {
    for (const [content, hasTitle] of [
        ['<h1 id="title">Existing title</h1><h2>Body</h2>', true],
        ['<h2>Body</h2>', false],
        ['<pre><code>&lt;h1&gt;Example&lt;/h1&gt;</code></pre>', false],
    ] as const) {
        const rendered = await renderArticleContent({
            contentFormat: 'html',
            content,
        })
        assert.equal(rendered.hasTitle, hasTitle)
    }
})

for (const codeHighlight of [false, true]) {
    test(`local GFM tables render with codeHighlight=${codeHighlight}`, async () => {
        const rendered = await renderArticleContent(
            {
                contentFormat: 'mdx',
                content: [
                    '## Resources',
                    '',
                    '| Resource | Impact |',
                    '| --- | --- |',
                    '| `<head>` CSS | **Blocking** |',
                    '| Image | Non-blocking |',
                ].join('\n'),
            },
            { codeHighlight }
        )
        assert.equal(rendered.mode, 'mdx')
        const markup = renderToStaticMarkup(
            createElement(Fragment, null, rendered.content)
        )
        assert.match(markup, /<table>/)
        assert.match(
            markup,
            /<thead><tr><th>Resource<\/th><th>Impact<\/th><\/tr><\/thead>/
        )
        assert.match(markup, /<td><code>&lt;head&gt;<\/code> CSS<\/td>/)
        assert.match(markup, /<td><strong>Blocking<\/strong><\/td>/)
        assert.equal((markup.match(/<tbody>/g) ?? []).length, 1)
        assert.equal((markup.match(/<tr>/g) ?? []).length, 3)
        assert.doesNotMatch(markup, /\| --- \|/)
        assert.equal(rendered.toc?.[0]?.value, 'Resources')
    })
}

test('critical rendering path article renders its resource comparison as a table', async () => {
    const content = await readFile(
        new URL(
            '../category/fe/browser/critical-rendering-path-diagnosis.mdx',
            import.meta.url
        ),
        'utf8'
    )
    const rendered = await renderArticleContent(
        { contentFormat: 'mdx', content },
        { codeHighlight: false }
    )
    assert.equal(rendered.mode, 'mdx')
    const markup = renderToStaticMarkup(
        createElement(Fragment, null, rendered.content)
    )
    assert.match(markup, /<th>리소스<\/th>/)
    assert.match(markup, /<th>초기 화면에 주는 기본 영향<\/th>/)
    assert.match(markup, /<td>HTML<\/td>/)
    assert.match(markup, /<td>DOM 구성의 시작점<\/td>/)
    assert.doesNotMatch(markup, /\| 리소스/)
})

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

test('renderArticleContent decodes remote html entities inside code blocks before highlighting', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content: `
            <h2>Browser permissions</h2>
            <pre><code class="language-tsx">const [state, setState] = React.useState&lt;BrowserPermissionState&gt;(BROWSER_PERMISSION_STATE.PROMPT);

React.useEffect(() =&gt; {
  return state;
}</code></pre>
        `,
    })

    assert.equal(rendered.mode, 'html')
    assert.match(rendered.content, /React\.useState/)
    assert.match(rendered.content, /BrowserPermissionState/)
    assert.match(rendered.content, /\(\) =&gt; \{/)
    assert.doesNotMatch(rendered.content, /&amp;lt;BrowserPermissionState/)
    assert.doesNotMatch(rendered.content, /&amp;gt;/)
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
            <h2 onclick="alert('x')"><script>alert("heading")</script>Safe Heading</h2>
            <a href="javascript:alert(1)" target="_blank">Unsafe Link</a>
            <a href="https://heap-forge.app" target="_blank">Safe Link</a>
            <img src="https://assets.heap-forge.app/safe.webp" onerror="alert(1)" alt="safe">
            <pre><code class="language-html">&lt;script&gt;alert("code")&lt;/script&gt;</code></pre>
        `,
        'text/html'
    )

    assert.ok(normalizedRemoteContent)

    const rendered = await renderArticleContent(normalizedRemoteContent)

    assert.equal(rendered.mode, 'html')
    assert.equal(rendered.toc[0]?.value, 'Safe Heading')
    assert.doesNotMatch(rendered.content, /<script/i)
    assert.doesNotMatch(rendered.content, /onclick=/i)
    assert.doesNotMatch(rendered.content, /onerror=/i)
    assert.doesNotMatch(rendered.content, /javascript:/i)
    assert.doesNotMatch(rendered.content, /alert\("heading"\)/)
    assert.match(
        rendered.content,
        /<a href="https:\/\/heap-forge\.app" target="_blank" rel="noopener noreferrer">Safe Link<\/a>/
    )
    assert.match(
        rendered.content,
        /<img src="https:\/\/assets\.heap-forge\.app\/safe\.webp" alt="safe" \/>/
    )
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

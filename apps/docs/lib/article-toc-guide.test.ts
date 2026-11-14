import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { VFile } from 'vfile'
import { matter } from 'vfile-matter'
import { getMarkdownBodyStyleIssues } from '@web-tech/docs-content-contract/body-style'
import {
    desktopTocOptions,
    mobileTocOptions,
} from '../widgets/article-toc/examples/toc-options.ts'
import { filterTocItems } from '../widgets/article-toc/model/toc-items.ts'
import { renderArticleContent } from './render-article-content.ts'

const source = readFileSync(
    new URL('../widgets/article-toc/examples/article.md', import.meta.url),
    'utf8'
)

test('TOC guide stays an unpublished example and satisfies body rules', () => {
    const file = new VFile(source)
    matter(file, { strip: true })
    const frontmatter = file.data.matter as { status: string; slug: string }
    assert.equal(frontmatter.status, 'draft')
    assert.deepEqual(getMarkdownBodyStyleIssues(String(file), frontmatter), {
        failures: [],
        warnings: [],
    })
})

test('TOC guide options retain mobile focus behavior and shared filters', () => {
    assert.equal(desktopTocOptions.defaultOpen, true)
    assert.equal(desktopTocOptions.closeOnNavigate, false)
    assert.equal(mobileTocOptions.defaultOpen, false)
    assert.equal(mobileTocOptions.closeOnNavigate, true)
    assert.equal(mobileTocOptions.maxDepth, desktopTocOptions.maxDepth)
    assert.deepEqual(mobileTocOptions.skipLevels, desktopTocOptions.skipLevels)
})

test('actual Markdown guide produces six matching anchors without the fenced heading', async () => {
    const rendered = await renderArticleContent(
        { content: source, contentFormat: 'mdx' },
        { codeHighlight: false }
    )
    assert.equal(rendered.mode, 'mdx')
    const items = filterTocItems(rendered.toc, desktopTocOptions)
    assert.deepEqual(
        items.map(({ value, depth }) => [value, depth]),
        [
            ['문제를 확인하는 방법', 2],
            ['관측할 값', 3],
            ['비교 조건', 3],
            ['결과를 읽는 순서', 4],
            ['적용 전 점검', 2],
            ['참고 자료', 2],
        ]
    )
    assert.deepEqual(filterTocItems(rendered.toc, mobileTocOptions), items)
    const markup = renderToStaticMarkup(
        createElement(Fragment, null, rendered.content)
    )
    const ids = items.map(({ href }) => decodeURIComponent(href.slice(1)))
    assert.equal(new Set(ids).size, items.length)
    for (const id of ids) assert.ok(markup.includes(`id="${id}"`), id)
})

test('remote guide boundary excludes H1 and preserves authored anchors without inventing H5 support', async () => {
    const rendered = await renderArticleContent({
        contentFormat: 'html',
        content:
            '<h1>페이지 제목</h1><h2 id="authored-section">문제를 확인하는 방법</h2><h3>관측할 값</h3><h4>결과를 읽는 순서</h4><h5>깊은 제목</h5>',
    })
    assert.equal(rendered.mode, 'html')
    const items = filterTocItems(rendered.toc, desktopTocOptions)
    assert.deepEqual(
        items.map(({ depth }) => depth),
        [2, 3, 4]
    )
    assert.equal(items[0]?.href, '#authored-section')
    assert.ok(!items.some(({ value }) => value === '깊은 제목'))
})

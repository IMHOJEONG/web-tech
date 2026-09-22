import assert from 'node:assert/strict'
import test from 'node:test'
import { parseLocalDocument } from './local-document-parser.ts'
import type { Metadata } from './document.types.ts'

const header = `---
title: Shared parser
slug: shared-parser
summary: A shared document
date: '2026-09-19'
`

function parse(extra = '', body = '\n## Body\n') {
    return parseLocalDocument(
        '/content/test.md',
        'data/web/test',
        `${header}${extra}---\n${body}`
    )
}

test('normalizes common editorial fields, paths and thumbnails', () => {
    const doc = parseLocalDocument(
        '/content/test.md',
        'category\\fe\\react\\test',
        `${header}id: 42
author: Author
role: Engineer
readTime: '7'
topic: REACT
tags: 'react, nextjs, react'
thumbnail: 'public/images/cover.webp'
---
Body
`
    )
    assert.ok(doc)
    assert.equal(doc.id, '42')
    assert.equal(doc.fileName, 'category/fe/react/test')
    assert.equal(doc.thumbnail, '/images/cover.webp')
    assert.equal(doc.authorName, 'Author')
    assert.equal(doc.authorRole, 'Engineer')
    assert.equal(doc.readMinutes, 7)
    assert.equal(doc.topicLabel, 'REACT')
    assert.deepEqual(doc.tags, ['react', 'nextjs'])
    assert.equal(doc.contentFormat, 'mdx')
    assert.equal(doc.contentSource, 'local')
})

test('keeps body separators and code containing frontmatter-like text', () => {
    const body =
        '\nBefore\n\n---\nSearchable middle\n---\n\n```yaml\n---\nkey: value\n---\n```\n'
    const doc = parse('', body)
    assert.ok(doc)
    assert.ok(doc.content.includes(body.trim()))
    assert.ok(!doc.content.includes('title: Shared parser'))
})

test('uses the default image and excludes draft and archived documents', () => {
    assert.equal(parse()?.thumbnail, '/default/local-document.svg')
    assert.equal(parse('status: draft\n'), null)
    assert.equal(parse('status: archived\n'), null)
    assert.equal(parse('status: published\n')?.title, 'Shared parser')
})

test('rejects invalid published frontmatter instead of silently accepting it', () => {
    assert.throws(
        () =>
            parseLocalDocument(
                '/content/bad.md',
                'data/web/bad',
                '---\ntitle: Incomplete\n---\nBody'
            ),
        /Invalid frontmatter/
    )
    assert.throws(
        () =>
            parseLocalDocument(
                '/content/bad.md',
                'data/web/bad',
                `${header.replace("'2026-09-19'", 'not-a-date')}---\nBody`
            ),
        /date/
    )
})

// Compiled by typecheck:node-test, deliberately never executed.
function verifyReadonlyContract(doc: Metadata) {
    // @ts-expect-error Shared document fields are immutable.
    doc.title = 'changed'
    // @ts-expect-error Shared tag arrays cannot be mutated.
    doc.tags?.push('changed')
    const partial: Partial<Metadata> = doc
    // @ts-expect-error Partial must preserve readonly properties.
    partial.content = 'changed'
}
void verifyReadonlyContract

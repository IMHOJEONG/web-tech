import assert from 'node:assert/strict'
import test from 'node:test'
import { getContentStyleIssues } from './validate-content-style.mjs'

test('accepts existing blog-style heading flow', () => {
    const issues = getContentStyleIssues(
        `---
title: Example
slug: example
status: published
---

## 문제

### 원인

\`\`\`js
console.log('ok')
\`\`\`
`,
        { status: 'published', slug: 'example' }
    )

    assert.deepEqual(issues.failures, [])
    assert.deepEqual(issues.warnings, [])
})

test('rejects h1 headings and heading level jumps', () => {
    const issues = getContentStyleIssues(`# 제목

#### 너무 깊은 제목
`)

    assert.deepEqual(issues.failures, [
        'line 1: h1 is reserved for frontmatter title',
        'first heading should start at h2 or h3',
        'line 3: heading level jumps from h1 to h4',
    ])
})

test('rejects code fences without language and unclosed fences', () => {
    const issues = getContentStyleIssues(`## 코드

\`\`\`
const value = 1
`)

    assert.deepEqual(issues.failures, [
        'line 3: code block language is required',
        'code block is not closed',
    ])
})

test('warns for published placeholder-like content without failing', () => {
    const issues = getContentStyleIssues(
        `---
title: Test
slug: test
status: published
---

## TODO

임시 내용
`,
        { status: 'published', slug: 'test' }
    )

    assert.deepEqual(issues.failures, [])
    assert.deepEqual(issues.warnings, [
        'published content contains placeholder-like text',
        'published content uses a placeholder-like slug',
    ])
})

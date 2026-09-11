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

test('rejects malformed HTML comments used as writing markers', () => {
    const issues = getContentStyleIssues(`## 페인트

<!-- 작성중 →

- 각 노드를 화면에 페인팅하는 단계
`)

    assert.deepEqual(issues.failures, [
        'line 3: HTML comment is not closed with -->; use frontmatter status: draft for unfinished content',
    ])
})

test('rejects valid HTML comments outside code examples', () => {
    const issues = getContentStyleIssues(`## 페인트

<!-- 작성 중: 예시 보완 필요 -->
`)

    assert.deepEqual(issues.failures, [
        'line 3: HTML comments are not allowed; use frontmatter status: draft for unfinished content',
    ])
})

test('allows HTML comment syntax inside a fenced code example', () => {
    const issues = getContentStyleIssues(`## HTML 주석

\`\`\`html
<!-- 접근성 설명 -->
\`\`\`
`)

    assert.deepEqual(issues.failures, [])
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

test('accepts supported callout markers at the start of blockquotes', () => {
    const issues = getContentStyleIssues(`## 참고

> [!NOTE]
> 배경 맥락을 적습니다.

> [!TIP] 바로 적용할 수 있는 팁을 적습니다.

> [!WARNING]
> 장애로 이어질 수 있는 내용을 적습니다.
`)

    assert.deepEqual(issues.failures, [])
    assert.deepEqual(issues.warnings, [])
})

test('rejects unsupported callout markers', () => {
    const issues = getContentStyleIssues(`## 참고

> [!INFO]
> 아직 지원하지 않는 marker입니다.
`)

    assert.deepEqual(issues.failures, [
        'line 3: unsupported callout marker [!INFO]',
    ])
})

test('rejects callout markers outside the first text of a blockquote', () => {
    const issues = getContentStyleIssues(`## 참고

[!NOTE]
본문에 직접 marker를 쓰면 안 됩니다.

> 먼저 설명하고 [!TIP] marker를 뒤에 넣으면 안 됩니다.
`)

    assert.deepEqual(issues.failures, [
        'line 3: callout marker should be the first text in a blockquote',
        'line 6: callout marker should be the first text in a blockquote',
    ])
})

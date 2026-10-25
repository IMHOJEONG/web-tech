import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
    copyFile,
    mkdir,
    mkdtemp,
    readFile,
    realpath,
    rm,
    symlink,
    writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { getContentStyleIssues } from './validate-content-style.mjs'
import { getMarkdownBodyStyleIssues } from '@web-tech/docs-content-contract/body-style'

test('local frontmatter adapter produces the shared body validation result', () => {
    const metadata = { status: 'published', slug: 'example' }
    for (const body of [
        '## Topic\n<!-- writing -->',
        '## Topic\n<!-- writing →',
        '# Title\n#### Jump',
        '## Topic\n> [!INFO]',
        '## Topic\n~~~~html\n<!-- example -->\n~~~~',
        '## Topic\n~~~~js\ncode',
        '',
    ]) {
        const source = '---\nstatus: published\nslug: example\n---\n' + body
        assert.deepEqual(
            getContentStyleIssues(source, metadata),
            getMarkdownBodyStyleIssues(body, metadata)
        )
    }
})

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

test('warns for body h1 without blocking or rewriting local content', () => {
    const source =
        '---\ntitle: Metadata title\nstatus: published\n---\n# Original title\n\n## Section\n'
    const issues = getContentStyleIssues(source, { status: 'published' })
    assert.deepEqual(issues.failures, [])
    assert.deepEqual(issues.warnings, [
        'line 1: body h1 may duplicate frontmatter title; prefer h2 or h3',
    ])
    assert.match(source, /\n# Original title\n/)
    assert.doesNotMatch(source, /\n## Original title\n/)
})

test('real local CLI exits zero for h1 warnings but still fails on HTML comments', async () => {
    const root = await realpath(await mkdtemp(join(tmpdir(), 'docs-h1-style-')))
    try {
        for (const directory of ['scripts', 'data', 'category']) {
            await mkdir(join(root, directory))
        }
        for (const name of [
            'validate-content-style.mjs',
            'validate-content.mjs',
        ]) {
            await copyFile(
                new URL(name, import.meta.url),
                join(root, 'scripts', name)
            )
        }
        await symlink(
            fileURLToPath(new URL('../node_modules', import.meta.url)),
            join(root, 'node_modules'),
            'dir'
        )
        const file = join(root, 'data', 'body-title.mdx')
        const source =
            '---\ntitle: Metadata title\nslug: body-title\nstatus: published\n---\n# Original title\n\n## Section\n'
        await writeFile(file, source)
        const run = () =>
            spawnSync(
                process.execPath,
                [join(root, 'scripts', 'validate-content-style.mjs')],
                {
                    cwd: root,
                    encoding: 'utf8',
                    timeout: 10000,
                    maxBuffer: 64 * 1024,
                }
            )
        const warningOnly = run()
        assert.ifError(warningOnly.error)
        assert.equal(warningOnly.status, 0, warningOnly.stderr)
        assert.match(
            warningOnly.stderr,
            /body h1 may duplicate frontmatter title/
        )
        assert.match(
            warningOnly.stdout,
            /Content style validation passed for 1 files/
        )
        assert.equal(await readFile(file, 'utf8'), source)

        await writeFile(file, source + '<!-- writing -->\n')
        const invalid = run()
        assert.ifError(invalid.error)
        assert.equal(invalid.status, 1, invalid.stderr)
        assert.match(invalid.stderr, /HTML comments are not allowed/)
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})

test('h1 warnings preserve heading level jump failures', () => {
    const issues = getContentStyleIssues(`# 제목

#### 너무 깊은 제목
`)

    assert.deepEqual(issues.failures, [
        'line 3: heading level jumps from h1 to h4',
    ])
    assert.deepEqual(issues.warnings, [
        'line 1: body h1 may duplicate frontmatter title; prefer h2 or h3',
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

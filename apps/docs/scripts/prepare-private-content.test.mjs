import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { resolveLocalContentRoot } from '../lib/local-content-paths.ts'
import { getLocalSearchRevision } from '../lib/local-search-revision.ts'
import {
    preparePrivateContent,
    stagePrivateContent,
} from './prepare-private-content.mjs'

const revision = 'a'.repeat(40)
const lock = {
    revision,
    routes: ['/docs/web/demo'],
    retainedRemoteRoutes: ['/docs/feed/pna'],
}
const published = (body) => `---
status: published
slug: demo
title: Example
summary: Example summary
date: 2026-01-01
updatedAt: 2026-01-01
authorName: Example
authorRole: Engineer
readMinutes: 2
topicLabel: Web
---

${body}
`

function source(files) {
    return ([operation, spec]) => {
        if (operation === 'ls-tree') {
            const tree = Object.keys(files).map(
                (name) => `100644 blob fixture\t${name}\0`
            )
            return tree.join('')
        }
        assert.equal(operation, 'show')
        assert.ok(spec.startsWith(`${revision}:`))
        return Buffer.from(files[spec.slice(revision.length + 1)])
    }
}

function createRoot(t) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'private-content-test-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    return root
}

test('stages only published sources and referenced assets, preserving their canonical paths', async (t) => {
    const root = createRoot(t)
    const result = await stagePrivateContent(
        root,
        lock,
        source({
            'data/v8/demo.mdx': published(
                '![A diagram][diagram]\n\n[diagram]: /diagrams/example.png'
            ),
            'data/v8/draft.mdx':
                '---\nstatus: draft\nslug: draft\ntitle: Draft\n---\n![Private](/private.png)',
            'public/diagrams/example.png': 'image fixture',
            'public/private.png': 'draft asset',
            'public/unreferenced.png': 'unused asset',
        })
    )
    assert.deepEqual(result, { documentCount: 1, assetCount: 1 })
    const staged = resolveLocalContentRoot(root, revision)
    assert.deepEqual(fs.readdirSync(path.join(staged, 'data/v8')), ['demo.mdx'])
    assert.deepEqual(fs.readdirSync(path.join(root, 'public')), ['diagrams'])
    assert.notEqual(
        getLocalSearchRevision(staged, revision),
        getLocalSearchRevision(staged, 'b'.repeat(40))
    )
    assert.throws(
        () => resolveLocalContentRoot(root, 'b'.repeat(40)),
        /Prepared content is missing/
    )
})

test('rejects unapproved routes and collisions with the retained remote PNA path', async (t) => {
    const root = createRoot(t)
    const doc = published('## Main section')
    await assert.rejects(
        stagePrivateContent(root, lock, source({ 'data/v8/extra.mdx': doc })),
        /Published routes differ/
    )
    await assert.rejects(
        stagePrivateContent(
            root,
            { ...lock, retainedRemoteRoutes: ['/docs/web/demo'] },
            source({
                'data/v8/demo.mdx': doc,
            })
        ),
        /Duplicate published URL \/docs\/web\/demo.*remote API/
    )
    await assert.rejects(
        stagePrivateContent(
            root,
            lock,
            source({
                'data/v8/demo.mdx': doc,
                'data/v8/demo.md': doc,
            })
        ),
        /Duplicate published URL \/docs\/web\/demo/
    )
    assert.deepEqual(fs.readdirSync(root), [])
})

test('rejects missing assets, unsafe paths, and invalid document inputs', async (t) => {
    const root = createRoot(t)
    await assert.rejects(
        stagePrivateContent(
            root,
            lock,
            source({
                'data/v8/demo.mdx': published(
                    '<Image src="/diagrams/missing.png" />'
                ),
            })
        ),
        /Expected a regular file.*missing.png/
    )
    await assert.rejects(
        stagePrivateContent(
            root,
            lock,
            source({
                'data/v8/demo.mdx': published('![Unsafe](../../secret.png)'),
            })
        ),
        /invalid local image or asset reference/
    )
    await assert.rejects(
        stagePrivateContent(
            root,
            lock,
            source({
                'data/v8/demo.mdx': published('Content').replace(
                    'status: published',
                    'status: invalid'
                ),
            })
        ),
        /status must be/
    )
    await assert.rejects(
        stagePrivateContent(
            root,
            lock,
            source({
                'data/v8/demo.html': '<html></html>',
            })
        ),
        /Only Markdown or MDX/
    )
    assert.deepEqual(fs.readdirSync(root), [])
})

test('leaves the default build alone and fails for an enabled Preview without a key', async () => {
    assert.equal(await preparePrivateContent('unused', {}), undefined)
    await assert.rejects(
        preparePrivateContent('unused', {
            DOCS_PRIVATE_CONTENT_ENABLED: '1',
            VERCEL_ENV: 'preview',
        }),
        /SSH_KEY is required/
    )
})

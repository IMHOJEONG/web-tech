import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadLocalSearchIndex } from './local-search-index.ts'
import {
    getLocalSearchRevision,
    shouldCacheLocalSearchIndex,
} from './local-search-revision.ts'

const article = (title: string, status = 'published') =>
    `---\ntitle: ${title}\nslug: test\nsummary: Test summary\ndate: '2026-10-03'\nstatus: ${status}\n---\nBody\n---\nSearchable middle\n`

test('local index excludes drafts and preserves canonical routes and body separators', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'search-index-'))
    try {
        await mkdir(path.join(root, 'data/v8'), { recursive: true })
        await writeFile(
            path.join(root, 'data/v8/published.md'),
            article('Published')
        )
        await writeFile(
            path.join(root, 'data/v8/draft.mdx'),
            article('Draft', 'draft')
        )
        const docs = await loadLocalSearchIndex(root)
        assert.equal(docs.length, 1)
        assert.equal(docs[0]?.href, '/docs/web/published')
        assert.equal(docs[0]?.section, 'Web')
        assert.ok(docs[0]?.content.includes('---\nSearchable middle'))
        await writeFile(
            path.join(root, 'data/v8/published.md'),
            article('Published', 'draft')
        )
        assert.deepEqual(await loadLocalSearchIndex(root), [])
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})

test('build revision changes with Markdown content and paths, but ignores other assets', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'search-revision-'))
    try {
        await mkdir(path.join(root, 'data'))
        const file = path.join(root, 'data/test.md')
        await writeFile(file, article('V1'))
        const first = getLocalSearchRevision(root)
        assert.equal(getLocalSearchRevision(root), first)
        await writeFile(path.join(root, 'data/asset.txt'), 'ignored')
        assert.equal(getLocalSearchRevision(root), first)
        await writeFile(file, article('V2'))
        assert.notEqual(getLocalSearchRevision(root), first)
        await writeFile(file, article('V1'))
        await writeFile(path.join(root, 'data/added.mdx'), article('V1'))
        assert.notEqual(getLocalSearchRevision(root), first)
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})

test('only production with a build revision enables persistent index reuse', () => {
    assert.equal(shouldCacheLocalSearchIndex('production', 'digest'), true)
    assert.equal(shouldCacheLocalSearchIndex('development', 'digest'), false)
    assert.equal(shouldCacheLocalSearchIndex('test', 'digest'), false)
    assert.equal(shouldCacheLocalSearchIndex('production', ''), false)
})

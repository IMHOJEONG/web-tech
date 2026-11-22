import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { getLocalDraftPreview } from './local-draft-preview.ts'

test('development preview reads only registered drafts and rejects traversal and symlinks', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'docs-draft-preview-'))
    const original = process.env.NODE_ENV
    const article = (status: string) =>
        `---\ntitle: Preview\nslug: preview\nsummary: Preview fixture\ndate: 2026-10-09\nstatus: ${status}\n---\n## Body\n`
    try {
        await mkdir(path.join(root, 'category'), { recursive: true })
        for (const status of ['draft', 'published', 'archived']) {
            await writeFile(
                path.join(root, `category/${status}.mdx`),
                article(status)
            )
        }
        await writeFile(path.join(root, 'outside.mdx'), article('draft'))
        await symlink(
            path.join(root, 'outside.mdx'),
            path.join(root, 'category/link.mdx')
        )
        for (const environment of ['production', 'test', 'development']) {
            Reflect.set(process.env, 'NODE_ENV', environment)
            assert.equal(
                getLocalDraftPreview('category/draft', root)?.status ?? null,
                environment === 'development' ? 'draft' : null
            )
            for (const route of [
                'category/published',
                'category/archived',
                'category/missing',
                'category/link',
                'category/../outside',
                'category/%2e%2e/outside',
            ]) {
                assert.equal(getLocalDraftPreview(route, root), null)
            }
        }
    } finally {
        if (original === undefined)
            Reflect.deleteProperty(process.env, 'NODE_ENV')
        else Reflect.set(process.env, 'NODE_ENV', original)
        await rm(root, { recursive: true, force: true })
    }
})

test('external draft root is development-only and independent of prepared publication', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'docs-external-draft-'))
    const keys = [
        'NODE_ENV',
        'DOCS_LOCAL_DRAFT_ROOT',
        'DOCS_CONTENT_SOURCE',
        'DOCS_PRIVATE_CONTENT_REVISION',
    ] as const
    const original = Object.fromEntries(
        keys.map((key) => [key, process.env[key]])
    )
    const article = (status: string) =>
        `---\ntitle: External fixture\nslug: external\nsummary: Synthetic preview\ndate: 2026-11-20\nstatus: ${status}\n---\n## Body\n`
    try {
        await mkdir(path.join(root, 'category'))
        for (const status of ['draft', 'published', 'archived']) {
            await writeFile(
                path.join(root, `category/${status}.mdx`),
                article(status)
            )
        }
        await writeFile(path.join(root, 'outside.mdx'), article('draft'))
        await symlink(
            path.join(root, 'outside.mdx'),
            path.join(root, 'category/link.mdx')
        )
        process.env.DOCS_LOCAL_DRAFT_ROOT = root
        process.env.DOCS_CONTENT_SOURCE = 'private-git'
        delete process.env.DOCS_PRIVATE_CONTENT_REVISION
        Reflect.set(process.env, 'NODE_ENV', 'development')
        assert.equal(
            getLocalDraftPreview('category/draft')?.title,
            'External fixture'
        )
        for (const route of [
            'category/published',
            'category/archived',
            'category/missing',
            'category/link',
            'category/../outside',
            'category/%2e%2e/outside',
        ]) {
            assert.equal(getLocalDraftPreview(route), null)
        }
        process.env.DOCS_LOCAL_DRAFT_ROOT = 'relative-root'
        assert.throws(
            () => getLocalDraftPreview('category/draft'),
            /absolute path/
        )
        assert.equal(
            getLocalDraftPreview('category/draft', root)?.status,
            'draft'
        )
        for (const environment of ['production', 'test']) {
            Reflect.set(process.env, 'NODE_ENV', environment)
            assert.equal(getLocalDraftPreview('category/draft'), null)
        }
    } finally {
        for (const key of keys) {
            if (original[key] === undefined) delete process.env[key]
            else Reflect.set(process.env, key, original[key])
        }
        await rm(root, { recursive: true, force: true })
    }
})

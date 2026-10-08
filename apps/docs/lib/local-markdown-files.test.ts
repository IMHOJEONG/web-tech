import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
    mkdtemp,
    mkdir,
    readFile,
    rename,
    rm,
    symlink,
    writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
    listLocalMarkdownFiles,
    listMarkdownFiles,
} from './local-markdown-files.ts'
import { getLocalSearchRevision } from './local-search-revision.ts'

test('walker uses literal directories, supported files and deterministic traversal', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'markdown-walk-'))
    try {
        for (const name of [
            'data/nested',
            'data/.hidden',
            'category/fe/react',
            'outside',
            'data/{one,two}',
        ])
            await mkdir(path.join(root, name), { recursive: true })
        for (const name of [
            'data/z.mdx',
            'data/a.md',
            'data/nested/b.md',
            'data/.hidden/no.md',
            'data/.no.md',
            'data/no.MD',
            'data/no.txt',
            'outside/no.md',
            'category/fe/react/c.md',
            'data/{one,two}/literal.mdx',
        ])
            await writeFile(path.join(root, name), name)
        await symlink(
            path.join(root, 'outside'),
            path.join(root, 'data/link'),
            'dir'
        )
        await symlink(
            path.join(root, 'outside/no.md'),
            path.join(root, 'data/link.md')
        )
        assert.deepEqual(listMarkdownFiles(path.join(root, 'data')), [
            path.join(root, 'data/a.md'),
            path.join(root, 'data/z.mdx'),
        ])
        const files = [
            'category/fe/react/c.md',
            'data/a.md',
            'data/nested/b.md',
            'data/z.mdx',
            'data/{one,two}/literal.mdx',
        ]
            .map((name) => path.join(root, name))
            .sort()
        assert.deepEqual(listLocalMarkdownFiles(root), files)
        assert.deepEqual(listMarkdownFiles(path.join(root, 'data/{one,two}')), [
            path.join(root, 'data/{one,two}/literal.mdx'),
        ])
        assert.deepEqual(
            listMarkdownFiles(path.join(root, 'missing'), true),
            []
        )
        assert.deepEqual(
            listMarkdownFiles(path.join(root, 'data/link'), true),
            []
        )
        const hash = createHash('sha256')
        for (const file of files) {
            const body = await readFile(file)
            hash.update(
                JSON.stringify([
                    path.relative(root, file).split(path.sep).join('/'),
                    body.length,
                ])
            )
            hash.update(body)
        }
        assert.equal(getLocalSearchRevision(root), hash.digest('hex'))
        await rename(
            path.join(root, 'category'),
            path.join(root, 'outside/category')
        )
        await symlink(
            path.join(root, 'outside/category'),
            path.join(root, 'category'),
            'dir'
        )
        assert.ok(
            listLocalMarkdownFiles(root).every((file) =>
                file.startsWith(path.join(root, 'data') + path.sep)
            )
        )
    } finally {
        await rm(root, { recursive: true, force: true })
    }
})

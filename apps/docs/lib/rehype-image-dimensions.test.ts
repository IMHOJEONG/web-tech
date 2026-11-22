import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile, symlink, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import sharp from 'sharp'
import { rehypeImageDimensions } from './rehype-image-dimensions.ts'

test('local images get oriented dimensions while authored dimensions are preserved', async (t) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'article-image-size-'))
    t.after(() => rm(root, { recursive: true, force: true }))
    await sharp({
        create: { width: 120, height: 80, channels: 3, background: '#123456' },
    })
        .png()
        .toFile(path.join(root, 'test image.png'))
    await sharp({
        create: { width: 120, height: 80, channels: 3, background: '#123456' },
    })
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toFile(path.join(root, 'rotated.jpg'))
    const images: Record<string, unknown>[] = [
        { src: '/test%20image.png?v=1' },
        { src: '/test%20image.png', width: '60' },
        { src: '/test%20image.png', height: '40' },
        { src: '/test%20image.png', width: '30', height: '10' },
        { src: '/rotated.jpg' },
    ]
    await rehypeImageDimensions({ publicRoot: root })({
        type: 'root',
        children: images.map((properties) => ({
            type: 'element',
            tagName: 'img',
            properties,
        })),
    })
    assert.deepEqual(
        images.map(({ width, height }) => [width, height]),
        [
            [120, 80],
            [60, 40],
            [60, 40],
            ['30', '10'],
            [80, 120],
        ]
    )
})

test('missing assets, external URLs and paths escaping public keep their fallback', async (t) => {
    const root = await mkdtemp(
        path.join(os.tmpdir(), 'article-image-boundary-')
    )
    const publicRoot = path.join(root, 'public')
    await mkdir(publicRoot)
    t.after(() => rm(root, { recursive: true, force: true }))
    await writeFile(
        path.join(root, 'outside.svg'),
        '<svg width="120" height="80" xmlns="http://www.w3.org/2000/svg"/>'
    )
    await symlink(
        path.join(root, 'outside.svg'),
        path.join(publicRoot, 'escape.svg')
    )
    const sources = [
        '/missing.png',
        '/escape.svg',
        '/../outside.svg',
        '/%2e%2e/outside.svg',
        '/%zz.png',
        '//example.com/test.png',
        'https://example.com/test.png',
        'relative.png',
    ]
    const images = sources.map((src) => ({
        type: 'element',
        tagName: 'img',
        properties: { src },
    }))
    await rehypeImageDimensions({ publicRoot })({
        type: 'root',
        children: images,
    })
    assert.deepEqual(
        images.map((image) => image.properties),
        sources.map((src) => ({ src }))
    )
})

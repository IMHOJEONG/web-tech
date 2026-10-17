import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { rehypePublicImages } from './rehype-public-images.ts'

test('file-relative public diagrams render at their website URL', () => {
    const image = {
        type: 'element',
        tagName: 'img',
        properties: {
            src: '../../../public/diagrams/http-response-stages.png',
        },
    }
    rehypePublicImages()({ type: 'root', children: [image] })
    assert.equal(image.properties.src, '/diagrams/http-response-stages.png')
})

test('existing URLs and paths escaping public remain unchanged', () => {
    for (const src of [
        '/diagrams/existing.svg',
        'https://example.com/image.png',
        '../images/image.png',
        '../../../public/../secret.png',
        '../../../public/diagrams/%2e%2e/secret.png',
    ]) {
        const image = { type: 'element', tagName: 'img', properties: { src } }
        rehypePublicImages()(image)
        assert.equal(image.properties.src, src)
    }
})

test('HTTP draft images exist for both file preview and public serving', async () => {
    const articleUrl = new URL(
        '../category/be/node-js/http-response-streaming-lab.mdx',
        import.meta.url
    )
    const article = await readFile(articleUrl, 'utf8')
    const images = [...article.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
    assert.equal(images.length, 4)
    for (const [, src] of images) {
        assert.equal(typeof src, 'string')
        assert.ok(src)
        const image = { type: 'element', tagName: 'img', properties: { src } }
        rehypePublicImages()(image)
        const fileUrl = new URL(src, articleUrl)
        const publicUrl = new URL(
            `../public${image.properties.src}`,
            import.meta.url
        )
        assert.equal(fileUrl.href, publicUrl.href)
        const bytes = await readFile(fileUrl)
        assert.deepEqual(
            [...bytes.subarray(0, 8)],
            [137, 80, 78, 71, 13, 10, 26, 10]
        )
    }
})

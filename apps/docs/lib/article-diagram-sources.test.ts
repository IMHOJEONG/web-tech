import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getArticleDiagramSources } from './article-diagram-sources.ts'

test('responsive diagrams have real portrait and landscape files', async () => {
    for (const name of [
        'stages',
        'completion',
        'local-architecture',
        'service-infrastructure',
    ]) {
        const sources = getArticleDiagramSources(
            `/diagrams/http-response-${name}.png`
        )
        assert.ok(sources)
        const portrait = await readFile(
            new URL(`../public${sources.portrait}`, import.meta.url)
        )
        const landscape = await readFile(
            new URL(`../public${sources.landscape}`, import.meta.url)
        )
        assert.equal(portrait.readUInt32BE(16), 720)
        assert.equal(portrait.readUInt32BE(20), sources.portraitHeight)
        assert.equal(landscape.readUInt32BE(16), 1600)
        assert.ok(landscape.readUInt32BE(20) < landscape.readUInt32BE(16))
    }
})

test('other article and remote images keep their existing rendering', () => {
    for (const src of [
        '/diagrams/other.png',
        '/image/cover.png',
        'https://example.com/diagrams/http-response-stages.png',
        undefined,
    ]) {
        assert.equal(getArticleDiagramSources(src), null)
    }
})

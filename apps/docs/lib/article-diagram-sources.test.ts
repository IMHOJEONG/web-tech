import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getArticleDiagramSources } from './article-diagram-sources.ts'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { writeSyntheticImages } from '../../../scripts/synthetic-docs-media.mts'

test('responsive diagram metadata matches the public and synthetic dimensions', async (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-diagrams-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    writeSyntheticImages(root)
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
            path.join(root, 'public', sources.portrait)
        )
        const landscape = await readFile(
            path.join(root, 'public', sources.landscape)
        )
        assert.equal(portrait.readUInt32BE(16), 720)
        assert.equal(portrait.readUInt32BE(20), sources.portraitHeight)
        assert.equal(landscape.readUInt32BE(16), 1600)
        assert.equal(landscape.readUInt32BE(20), sources.landscapeHeight)
        const publicLandscape = await readFile(
            new URL(`../public${sources.landscape}`, import.meta.url)
        )
        assert.equal(publicLandscape.readUInt32BE(16), 1600)
        assert.equal(publicLandscape.readUInt32BE(20), sources.landscapeHeight)
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

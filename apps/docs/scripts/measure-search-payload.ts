import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { cpus } from 'node:os'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import {
    CONTENT_POSTS_MAX_BYTES,
    CONTENT_POSTS_WARN_BYTES,
    parseRemotePostsPayload,
} from '@web-tech/docs-content-contract'
import type {
    Metadata,
    RemotePost,
    SearchData,
} from '../lib/content-api-types.ts'
import { createSearchPayloadFixture } from '../lib/search-payload-fixture.ts'
import { rankSearchDocs } from '../lib/search-ranking.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const bundle = await build({
    stdin: {
        contents:
            "export { normalizeRemotePostMeta, normalizeRemoteSearchResult } from './lib/content-api-normalize'",
        resolveDir: root,
        loader: 'ts',
    },
    absWorkingDir: root,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    write: false,
})
type Normalizer = {
    normalizeRemotePostMeta(post: RemotePost): Partial<Metadata> | null
    normalizeRemoteSearchResult(post: Partial<Metadata>): SearchData | null
}
const loaded = { exports: {} as Normalizer }
const require = createRequire(import.meta.url)
new Function('require', 'module', 'exports', bundle.outputFiles[0]!.text)(
    (id: string) => (id === 'server-only' ? {} : require(id)),
    loaded,
    loaded.exports
)
function measure<T>(run: () => T) {
    const times: number[] = []
    let value!: T
    for (let i = 0; i < 6; i++) {
        const start = performance.now()
        value = run()
        if (i > 0) times.push(performance.now() - start)
    }
    times.sort((a, b) => a - b)
    return {
        value,
        timing: {
            medianMs: +times[2]!.toFixed(3),
            maxMs: +times[4]!.toFixed(3),
        },
    }
}
const cases = []
for (const count of [10, 100, 1000]) {
    for (const bodyBytes of [512, 8192, 32768]) {
        const payload = createSearchPayloadFixture(count, bodyBytes)
        const serialized = measure(() => JSON.stringify(payload))
        const json = serialized.value
        const bytes = Buffer.byteLength(json, 'utf8')
        const metadataBytes = Buffer.byteLength(
            JSON.stringify({
                results: payload.results.map((post) => {
                    const metadata = { ...post }
                    delete metadata.searchText
                    return metadata
                }),
            })
        )
        const parsed = measure(() => {
            const posts = parseRemotePostsPayload(JSON.parse(json))
            assert.ok(posts)
            assert.equal(posts.length, count)
            return posts
        })
        const normalized = measure(() =>
            parsed.value.map((post) => {
                const meta = loaded.exports.normalizeRemotePostMeta(post)
                assert.ok(meta)
                const result = loaded.exports.normalizeRemoteSearchResult(meta)
                assert.ok(result)
                return result
            })
        )
        const queries = []
        for (const query of [
            'event loop',
            'lastbodyneedle',
            'absentuniqueneedle',
        ]) {
            const ranked = measure(() =>
                rankSearchDocs(normalized.value, query)
            )
            const expected =
                query === 'event loop'
                    ? count
                    : query === 'lastbodyneedle'
                      ? 1
                      : 0
            assert.equal(ranked.value.length, expected)
            if (query === 'lastbodyneedle')
                assert.equal(ranked.value[0]?.slug, `probe-${count - 1}`)
            queries.push({
                query,
                matches: ranked.value.length,
                ...ranked.timing,
            })
        }
        cases.push({
            count,
            bodyBytes,
            jsonBytes: bytes,
            metadataBytes,
            gzipBytes: gzipSync(json).byteLength,
            budget:
                bytes > CONTENT_POSTS_MAX_BYTES
                    ? 'reject'
                    : bytes > CONTENT_POSTS_WARN_BYTES
                      ? 'warn'
                      : 'accept',
            serialize: serialized.timing,
            parseAndValidate: parsed.timing,
            normalize: normalized.timing,
            rank: queries,
        })
    }
}
console.log(
    JSON.stringify(
        {
            date: '2026-10-26',
            node: process.version,
            cpu: cpus()[0]?.model,
            maxBytes: CONTENT_POSTS_MAX_BYTES,
            warnBytes: CONTENT_POSTS_WARN_BYTES,
            samples:
                'one warmup excluded, five measured samples; median and maximum, not p95',
            scope: 'synthetic UTF-8 JSON, real schema/normalizer/ranker; no HTTP, NAS, Markdown parse, cache or concurrency; rejected cases measured offline only',
            compressionCaveat:
                'repeated synthetic text compresses unusually well; gzip bytes are not the acceptance budget',
            cases,
        },
        null,
        2
    )
)

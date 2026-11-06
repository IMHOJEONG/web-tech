import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { observeCacheExpiry } from './cache-expiry-observation.ts'

test('expiry observations contain only finite timing and ignore unsafe inputs', () => {
    const manifest = new Map<string, { expired?: unknown }>([
        ['synthetic-tag', { expired: 1000 }],
        ['synthetic-soft', { expired: 1001 }],
        ['invalid', { expired: Number.POSITIVE_INFINITY }],
    ])
    const context = {
        kind: 'FETCH',
        tags: ['synthetic-tag', 'invalid'],
        softTags: ['synthetic-soft'],
    }
    expect(
        observeCacheExpiry(
            { lastModified: 1000, payload: 'synthetic-private-body' },
            context,
            manifest
        )
    ).toEqual({ tagExpiredAt: 1001, entryMinusExpiryMs: -1 })
    expect(
        observeCacheExpiry({ lastModified: 1001 }, context, manifest)
    ).toEqual({ tagExpiredAt: 1001, entryMinusExpiryMs: 0 })
    expect(
        observeCacheExpiry({ lastModified: 1002 }, context, manifest)
    ).toEqual({ tagExpiredAt: 1001, entryMinusExpiryMs: 1 })
    for (const bad of [
        null,
        {},
        { kind: 'APP_PAGE', tags: ['synthetic-tag'] },
        { kind: 'FETCH', tags: [42] },
        {
            get kind() {
                throw new Error('synthetic-private-accessor')
            },
        },
    ]) {
        expect(observeCacheExpiry({}, bad, manifest)).toEqual({
            tagExpiredAt: null,
            entryMinusExpiryMs: null,
        })
    }
    expect(
        observeCacheExpiry({ lastModified: Number.NaN }, context, manifest)
    ).toEqual({ tagExpiredAt: 1001, entryMinusExpiryMs: null })
    expect(
        JSON.stringify(
            observeCacheExpiry(
                { lastModified: 1000, payload: 'synthetic-private-body' },
                context,
                manifest
            )
        )
    ).not.toContain('synthetic')
    expect(
        observeCacheExpiry(
            { lastModified: Number.MAX_VALUE },
            { kind: 'FETCH', tags: ['synthetic'] },
            new Map([['synthetic', { expired: -Number.MAX_VALUE }]])
        )
    ).toEqual({ tagExpiredAt: -Number.MAX_VALUE, entryMinusExpiryMs: null })
})

test('installed Next expiry comparator uses a strict timestamp boundary', () => {
    const require = createRequire(import.meta.url)
    const { tagsManifest, areTagsExpired } =
        require('next/dist/server/lib/incremental-cache/tags-manifest.external') as {
            tagsManifest: Map<string, unknown>
            areTagsExpired: (tags: string[], timestamp: number) => boolean
        }
    const tag = 'synthetic-expiry-contract-only'
    const previous = tagsManifest.get(tag)
    const existed = tagsManifest.has(tag)
    try {
        // Controlled past timestamps, not a mocked clock or a server mutation.
        tagsManifest.set(tag, { expired: 1000 })
        expect(areTagsExpired([tag], 999)).toBe(true)
        expect(areTagsExpired([tag], 1000)).toBe(false)
        expect(areTagsExpired([tag], 1001)).toBe(false)
    } finally {
        if (existed) tagsManifest.set(tag, previous)
        else tagsManifest.delete(tag)
    }
})

test('expiry checkpoint is opt-in and persisted when enabled', async ({
    request,
}) => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const directory = process.env.ARTICLE_CACHE_OBSERVATION_DIR
    const response = await request.get('/__test/cache-observation/checkpoint', {
        headers: { 'x-article-cache-probe': '1' },
    })
    if (!directory) {
        expect(response.status()).toBe(404)
        expect(response.headers()['content-type']).not.toContain(
            'application/json'
        )
        return
    }
    expect(response.status()).toBe(200)
    const checkpoint = await response.json()
    const saved = JSON.parse(
        await readFile(join(directory, 'cache-events.json'), 'utf8')
    )
    expect(checkpoint.deliveryFailures).toBe(0)
    expect(checkpoint.omitted).toBe(0)
    expect(saved.deliveryFailures).toBe(0)
    expect(saved.omitted).toBe(0)
    expect(saved.runId).toBe(checkpoint.runId)
    expect(
        saved.events.some(
            (event: {
                sequence: number
                probeId: number
                operation: string
                phase: string
            }) =>
                event.sequence === checkpoint.sequence &&
                event.probeId === checkpoint.probeId &&
                event.operation === 'checkpoint' &&
                event.phase === 'end'
        )
    ).toBe(true)
})

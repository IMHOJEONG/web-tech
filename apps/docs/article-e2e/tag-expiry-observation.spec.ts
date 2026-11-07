import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { observeCacheExpiry } from './cache-expiry-observation.ts'
import { articleFixtureAuthorization } from './fixture-credentials.ts'

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

test('live tagged refill exposes finite expiry timing on a later cache hit', async ({
    request,
}) => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const directory = process.env.ARTICLE_CACHE_OBSERVATION_DIR
    test.skip(!directory, 'Explicit private observation mode only')
    const auth = { Authorization: articleFixtureAuthorization('control') }
    const control = async (action: string) => {
        expect(
            (
                await request.post(
                    `http://127.0.0.1:3112/__test/publication/${action}`,
                    { headers: auth }
                )
            ).status()
        ).toBe(204)
    }
    const invalidate = async () => {
        expect(
            (
                await request.post('/api/revalidate/content', {
                    headers: {
                        Authorization:
                            articleFixtureAuthorization('revalidation'),
                    },
                })
            ).status()
        ).toBe(200)
    }
    try {
        await control('reset')
        await control('2')
        const initial = await request.get(
            '/__test/cache-observation/checkpoint'
        )
        expect(initial.status()).toBe(200)
        const start = (await initial.json()).sequence as number
        await invalidate()
        for (let i = 0; i < 2; i++) {
            const response = await request.get(
                '/ko/docs/web/article-e2e-publication'
            )
            expect(response.status()).toBe(200)
            expect(await response.text()).toContain('PUBLICATION_END_V2')
        }
        const checkpoint = await request.get(
            '/__test/cache-observation/checkpoint'
        )
        expect(checkpoint.status()).toBe(200)
        const saved = JSON.parse(
            await readFile(join(directory!, 'cache-events.json'), 'utf8')
        ) as {
            omitted: number
            deliveryFailures: number
            events: {
                sequence: number
                operation: string
                phase: string
                keyHash: string | null
                found: boolean | null
                tagExpiredAt: number | null
                entryMinusExpiryMs: number | null
            }[]
        }
        expect(saved.omitted).toBe(0)
        expect(saved.deliveryFailures).toBe(0)
        const events = saved.events.filter((event) => event.sequence > start)
        const invalidated = events.find(
            (event) =>
                event.operation === 'revalidateTag' && event.phase === 'end'
        )
        expect(invalidated).toBeDefined()
        const hit = events.find(
            (event) =>
                event.operation === 'get' &&
                event.phase === 'end' &&
                event.found === true &&
                event.tagExpiredAt !== null &&
                Number.isFinite(event.tagExpiredAt) &&
                event.entryMinusExpiryMs !== null &&
                Number.isFinite(event.entryMinusExpiryMs) &&
                events.some(
                    (write) =>
                        write.operation === 'set' &&
                        write.phase === 'end' &&
                        write.keyHash === event.keyHash &&
                        write.sequence > invalidated!.sequence &&
                        write.sequence < event.sequence
                )
        )
        expect(
            hit,
            'A live tagged refill must subsequently expose non-null finite expiry timing'
        ).toBeDefined()
    } finally {
        await control('reset')
        await invalidate()
    }
})

import { expect, test, type APIRequestContext } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { articleFixtureAuthorization } from './fixture-credentials.ts'

const origin = 'http://127.0.0.1:3112'
const article = '/ko/docs/web/article-e2e-publication'
const headers = { 'x-article-cache-probe': '1' }
async function control(request: APIRequestContext, action: string) {
    const response = await request.post(
        `${origin}/__test/publication/${action}`,
        {
            headers: { Authorization: articleFixtureAuthorization('control') },
        }
    )
    expect(response.status()).toBe(204)
}
async function invalidate(request: APIRequestContext) {
    const response = await request.post('/api/revalidate/content', {
        headers: {
            ...headers,
            Authorization: articleFixtureAuthorization('revalidation'),
        },
    })
    expect(response.status()).toBe(200)
}

test('publication diagnostic: invalidation overlaps a captured origin response', async ({
    request,
}, testInfo) => {
    // This is an ordering diagnostic, not a claim about the historical failure.
    await control(request, '1')
    await invalidate(request)
    await control(request, 'hold-body')
    const pending = request.get(article, { headers })
    try {
        await expect
            .poll(async () => {
                const state = await request.get(
                    `${origin}/__test/publication/state`,
                    {
                        headers: {
                            Authorization:
                                articleFixtureAuthorization('control'),
                        },
                    }
                )
                expect(state.status()).toBe(200)
                return (await state.json()).pending
            })
            .toBe(1)
        await control(request, '2')
        await invalidate(request)
        await control(request, 'release-body')
        const before = await pending
        expect(before.status()).toBe(200)
        expect((await before.text()).includes('PUBLICATION_END_V1')).toBe(true)
        const after = await request.get(article, { headers })
        expect(after.status()).toBe(200)
        const body = await after.text()
        const hasV1 = body.includes('PUBLICATION_END_V1')
        const hasV2 = body.includes('PUBLICATION_END_V2')
        expect(
            hasV1 !== hasV2,
            'A complete, unambiguous article must render'
        ).toBe(true)
        const result: Record<string, unknown> = {
            postWebhookVersion: hasV2 ? 2 : 1,
        }
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        const directory = process.env.ARTICLE_CACHE_OBSERVATION_DIR
        if (directory) {
            const evidence = JSON.parse(
                await readFile(join(directory, 'cache-events.json'), 'utf8')
            ) as {
                omitted: number
                deliveryFailures: number
                events: { operation: string; phase: string }[]
            }
            expect(evidence.omitted).toBe(0)
            expect(evidence.deliveryFailures).toBe(0)
            expect(
                evidence.events.some(
                    (event) => event.operation === 'revalidateTag'
                )
            ).toBe(true)
            result.observedCacheEvents = evidence.events.length
        }
        await testInfo.attach('inflight-order-summary', {
            body: JSON.stringify(result),
            contentType: 'application/json',
        })
        console.info('[cache-inflight-summary]', JSON.stringify(result))
        // A second webhook after all old work drains must yield the new body.
        await invalidate(request)
        const recovered = await request.get(article, { headers })
        expect(recovered.status()).toBe(200)
        expect((await recovered.text()).includes('PUBLICATION_END_V2')).toBe(
            true
        )
    } finally {
        await control(request, 'release-body')
        await pending.catch(() => {})
        await control(request, '1')
        await invalidate(request)
    }
})

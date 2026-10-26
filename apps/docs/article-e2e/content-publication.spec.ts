import {
    expect,
    test,
    type APIRequestContext,
    type Page,
    type Request,
} from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { traceBrowserNetwork } from './browser-network-trace.ts'

const origin = 'http://127.0.0.1:3112'
const documentPath = '/docs/web/article-e2e-publication'
const readToken = 'article-e2e-only-token'
const revalidationToken = 'article-e2e-only-revalidation'
const bodyKeyword = (version: 1 | 2) => `bodyonlypublicationv${version}needle`
// These diagnostics run via Playwright directly, not a cached Turbo task.
// eslint-disable-next-line turbo/no-undeclared-env-vars
const traceRequests = process.env.ARTICLE_STREAM_TRACE === '1'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const disablePrefetch = process.env.ARTICLE_DISABLE_PREFETCH === '1'

async function changeOrigin(request: APIRequestContext, version: 1 | 2) {
    const response = await request.post(
        `${origin}/__test/publication/${version}`,
        {
            headers: { Authorization: 'Bearer article-e2e-only-control' },
        }
    )
    expect(response.status()).toBe(204)
    const index = await request.get(`${origin}/api/posts`, {
        headers: { Authorization: `Bearer ${readToken}` },
    })
    expect(index.status()).toBe(200)
    const payload = await index.json()
    expect(payload.results).toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                title: `Publication cache probe V${version}`,
                searchText: expect.stringContaining(bodyKeyword(version)),
            }),
        ])
    )
    const post = payload.results.find(
        (entry: { slug: string }) => entry.slug === 'article-e2e-publication'
    )
    expect(
        JSON.stringify([
            post.id,
            post.slug,
            post.markdownPath,
            post.title,
            post.summary,
        ])
    ).not.toContain(bodyKeyword(version))
}

async function invalidate(request: APIRequestContext, token?: string) {
    const response = await request.post('/api/revalidate/content', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    expect(response.headers()['cache-control']).toBe('private, no-store')
    if (token === revalidationToken) {
        expect(response.status()).toBe(200)
        expect(await response.json()).toEqual({
            revalidated: true,
            revalidatedAt: expect.any(String),
        })
    } else {
        expect(response.status()).toBe(401)
        expect(await response.json()).toEqual({ message: 'Unauthorized' })
    }
}

async function expectArticle(page: Page, version: 1 | 2) {
    const body = page.locator('.mdx-wrapper')
    await expect(
        body.getByText(`PUBLICATION_BODY_V${version}`, { exact: true })
    ).toBeVisible()
    await expect(
        body.getByText(bodyKeyword(version), { exact: true })
    ).toBeVisible()
    await expect(
        body.getByText(`PUBLICATION_END_V${version}`, { exact: true })
    ).toBeVisible()
    await expect(page).toHaveTitle(`Publication cache probe V${version}`)
    await expect(page.getByTestId('article-pending')).toHaveCount(0)
    // Wait for this article's supplementary DOM; related-link prefetches
    // are separate requests and may still be pending on the next navigation.
    await expect(page.getByTestId('article-supplementary')).toHaveCount(1)
    await expect(page.getByTestId('article-supplementary-pending')).toHaveCount(
        0
    )
}

// Fresh document requests verify server caches, not the browser's Router Cache.
async function expectBodySearch(
    page: Page,
    request: APIRequestContext,
    locale: string,
    version: 1 | 2
) {
    const otherVersion = version === 1 ? 2 : 1
    for (const candidate of [version, otherVersion] as const) {
        const keyword = bodyKeyword(candidate)
        const matches = candidate === version
        const response = await request.get('/api/search', {
            params: { q: keyword },
        })
        expect(response.status()).toBe(200)
        const payload = await response.json()
        expect(payload.query).toBe(keyword)
        expect(payload.count).toBe(matches ? 1 : 0)
        expect(payload.results).toHaveLength(matches ? 1 : 0)
        if (matches) {
            expect(payload.results[0]).toEqual(
                expect.objectContaining({
                    href: documentPath,
                    title: `Publication cache probe V${version}`,
                    summary: `PUBLICATION_SUMMARY_V${version}`,
                })
            )
            expect(payload.results[0].content).toContain(keyword)
            expect(payload.results[0].content).not.toContain(
                bodyKeyword(otherVersion)
            )
            expect(payload.results[0].preview.excerptHtml).toContain(keyword)
        }

        await page.goto(`/${locale}/docs?q=${keyword}`)
        const card = page.locator(`main a[href="/${locale}${documentPath}"]`)
        if (matches) {
            await expect(card).toHaveCount(1)
            await expect(card.getByRole('heading')).toHaveText(
                `Publication cache probe V${version}`
            )
            await expect(card).toContainText(keyword)
        } else {
            await expect(
                page.getByRole('main').getByRole('heading', {
                    level: 1,
                    name:
                        locale === 'ko'
                            ? '검색 결과가 없어요'
                            : 'No matching documents',
                    exact: true,
                })
            ).toBeVisible()
            await expect(card).toHaveCount(0)
        }
    }
}

async function expectDirectScreens(
    page: Page,
    request: APIRequestContext,
    locale: string,
    version: 1 | 2
) {
    for (const suffix of ['', '?q=Publication%20cache%20probe']) {
        await page.goto(`/${locale}/docs${suffix}`)
        const card = page.locator(`main a[href="/${locale}${documentPath}"]`)
        await expect(card).toHaveCount(1)
        await expect(card.getByRole('heading')).toHaveText(
            `Publication cache probe V${version}`
        )
        await expect(card).toContainText(`PUBLICATION_SUMMARY_V${version}`)
    }
    await expectBodySearch(page, request, locale, version)
    await page.goto(`/${locale}${documentPath}`)
    await expectArticle(page, version)
}

for (const locale of ['ko', 'en']) {
    test(`direct URL cache: ${locale} publication refreshes index, search and article only after an authorized webhook`, async ({
        page,
        request,
    }) => {
        test.setTimeout(60_000)
        const errors: string[] = []
        const clientProbeIds = new WeakMap<Request, string>()
        page.on('pageerror', (error) => errors.push(error.message))
        // Opt-in diagnostics only: never log auth headers or query values.
        if (traceRequests) {
            await traceBrowserNetwork(page)
            const responseIds = new WeakMap<Request, string>()
            page.on('response', (response) => {
                const id = response.headers()['x-article-request-id']
                if (id) responseIds.set(response.request(), id)
            })
            const logRequest = (event: string) => (request: Request) => {
                const url = new URL(request.url())
                if (url.origin !== 'http://127.0.0.1:3111') return
                if (!['document', 'fetch'].includes(request.resourceType()))
                    return
                const time = new Date().toISOString()
                // Never await response() after an abort: headers may not arrive.
                const requestId = responseIds.get(request) ?? null
                console.info(
                    '[article-stream-trace]',
                    JSON.stringify({
                        time,
                        requestId,
                        clientProbeId: clientProbeIds.get(request) ?? null,
                        event,
                        path: url.pathname,
                        search: url.searchParams.has('q'),
                        type: request.resourceType(),
                        prefetch:
                            request.headers()['next-router-prefetch'] === '1' ||
                            'next-router-segment-prefetch' in request.headers(),
                        failure: request.failure()?.errorText,
                    })
                )
            }
            page.on('request', logRequest('request'))
            page.on('requestfinished', logRequest('requestfinished'))
            page.on('requestfailed', logRequest('requestfailed'))
        }
        if (traceRequests || disablePrefetch) {
            await page.route('**/*', async (route) => {
                const headers = route.request().headers()
                // Diagnostic control, not a production fix or the normal regression mode.
                if (
                    disablePrefetch &&
                    (headers['next-router-prefetch'] === '1' ||
                        'next-router-segment-prefetch' in headers)
                ) {
                    await route.fulfill({ status: 204 })
                } else {
                    const target = route.request()
                    if (
                        traceRequests &&
                        new URL(target.url()).origin ===
                            'http://127.0.0.1:3111' &&
                        ['document', 'fetch'].includes(target.resourceType())
                    ) {
                        const clientProbeId = randomUUID()
                        clientProbeIds.set(target, clientProbeId)
                        // Navigation may discard a request without a terminal
                        // browser event. Preserve its correlation at dispatch.
                        const url = new URL(target.url())
                        console.info(
                            '[article-stream-trace]',
                            JSON.stringify({
                                time: new Date().toISOString(),
                                event: 'request-dispatched',
                                requestId: null,
                                clientProbeId,
                                path: url.pathname,
                                search: url.searchParams.has('q'),
                                type: target.resourceType(),
                                prefetch:
                                    headers['next-router-prefetch'] === '1' ||
                                    'next-router-segment-prefetch' in headers,
                            })
                        )
                        await route.continue({
                            headers: {
                                ...headers,
                                'x-article-client-probe': clientProbeId,
                            },
                        })
                    } else {
                        await route.continue()
                    }
                }
            })
        }

        try {
            await test.step('Warm V1 in the real index, search and detail screens', async () => {
                await changeOrigin(request, 1)
                await invalidate(request, revalidationToken)
                await expectDirectScreens(page, request, locale, 1)
            })
            await test.step('Origin is V2 but cached screens stay V1', async () => {
                await changeOrigin(request, 2)
                await expectDirectScreens(page, request, locale, 1)
            })
            await test.step('Missing, invalid and read-only tokens cannot invalidate', async () => {
                for (const token of [
                    undefined,
                    'invalid-test-token',
                    readToken,
                ]) {
                    await invalidate(request, token)
                    await expectDirectScreens(page, request, locale, 1)
                }
            })
            await test.step('Authorized webhook updates the next request, not the already open DOM', async () => {
                await invalidate(request, revalidationToken)
                await expectArticle(page, 1)
                await page.reload()
                await expectArticle(page, 2)
                await expectDirectScreens(page, request, locale, 2)
            })
            await test.step('Search uses the new summary, not the old index entry', async () => {
                await page.goto(`/${locale}/docs?q=PUBLICATION_SUMMARY_V2`)
                await expect(
                    page.locator(`main a[href="/${locale}${documentPath}"]`)
                ).toBeVisible()
                await page.goto(`/${locale}/docs?q=PUBLICATION_SUMMARY_V1`)
                await expect(
                    page.getByRole('main').getByRole('heading', {
                        level: 1,
                        name:
                            locale === 'ko'
                                ? '검색 결과가 없어요'
                                : 'No matching documents',
                        exact: true,
                    })
                ).toBeVisible()
                await expect(
                    page.locator(`main a[href="/${locale}${documentPath}"]`)
                ).toHaveCount(0)
            })
            expect(errors, 'Unhandled browser errors').toEqual([])
        } finally {
            // One worker owns the mutable fixture; reset even after a failed assertion.
            await changeOrigin(request, 1)
            await invalidate(request, revalidationToken)
        }
    })
}

import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import {
    expect,
    type APIRequestContext,
    type Page,
    type TestInfo,
} from '@playwright/test'
import type { LifecycleSummary } from './request-lifecycle.ts'

export async function expectPrefetchNavigation(
    {
        page,
        request,
        locale,
        method,
        navigate,
    }: {
        page: Page
        request: APIRequestContext
        locale: string
        method: 'document-replacement' | 'menu-link' | 'prefetched-link'
        navigate: (destination: string) => Promise<void>
    },
    testInfo: TestInfo
) {
    const origin = 'http://127.0.0.1:3112'
    const remotePath = `/${locale}/docs/web/article-e2e-remote`
    const control = async (state: 'hold' | 'release') => {
        const response = await request.post(
            `${origin}/__test/remote-body/${state}`,
            {
                headers: {
                    Authorization: 'Bearer article-e2e-only-control',
                },
            }
        )
        expect(response.status()).toBe(204)
    }
    await control('release')
    const settled = await request.get(remotePath)
    expect(settled.status()).toBe(200)
    expect(await settled.text()).toContain(
        'The remote article has finished rendering.'
    )
    const invalidated = await request.post('/api/revalidate/content', {
        headers: {
            Authorization: 'Bearer article-e2e-only-revalidation',
        },
    })
    expect(invalidated.status()).toBe(200)

    const browserErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    // Keep normal prefetches; only opt the first target into observation.
    let observed = false
    await page.route('**/*', async (route) => {
        const target = route.request()
        const headers = target.headers()
        if (
            !observed &&
            new URL(target.url()).pathname === remotePath &&
            headers['next-router-prefetch'] === '1'
        ) {
            observed = true
            await route.continue({
                headers: {
                    ...headers,
                    'x-article-lifecycle-probe': '1',
                },
            })
        } else {
            await route.continue()
        }
    })
    await control('hold')
    try {
        const prefetched = page.waitForResponse(
            (response) =>
                new URL(response.url()).pathname === remotePath &&
                response.request().headers()['next-router-prefetch'] === '1'
        )
        // Bootstrap only; the spec supplies the actual move under test.
        await page.goto(`/${locale}/docs/web/article-e2e-publication`)
        const response = await prefetched
        expect(response.status()).toBe(200)
        const id = response.headers()['x-article-request-id']
        expect(id).toMatch(/^[\da-f-]{36}$/i)
        const summary = async (): Promise<LifecycleSummary> =>
            JSON.parse(
                await readFile(
                    `test-results/request-lifecycle/${id}.json`,
                    'utf8'
                )
            )
        const before = await summary()
        expect(before.responseFinished).not.toBe(true)
        expect(before.responseClosed).not.toBe(true)
        const identity = randomUUID()
        await page.evaluate(
            (value) =>
                Reflect.set(window, '__articleNavigationIdentity', value),
            identity
        )
        const navigationRequests: {
            path: string
            kind: string
            prefetch: boolean
            rsc: boolean
        }[] = []
        page.on('request', (next) => {
            const path = new URL(next.url()).pathname
            if (path === `/${locale}/web` || path === remotePath) {
                navigationRequests.push({
                    path,
                    kind: next.resourceType(),
                    prefetch:
                        next.headers()['next-router-prefetch'] === '1' ||
                        'next-router-segment-prefetch' in next.headers(),
                    rsc: next.headers().rsc === '1',
                })
            }
        })
        const destination =
            method === 'prefetched-link' ? remotePath : `/${locale}/web`
        await navigate(destination)
        // Opening the held article needs its body before asserting its UI.
        // Other-route cases keep it held until the destination has rendered.
        if (method === 'prefetched-link') await control('release')
        await expect(page).toHaveURL(new RegExp(`${destination}$`))
        await expect(page.getByRole('main')).toBeVisible()
        if (method === 'prefetched-link') {
            await expect(page.locator('.mdx-wrapper')).toContainText(
                'The remote article has finished rendering.'
            )
        } else {
            await expect(page.getByRole('main').locator('h1')).toBeVisible()
            await expect(
                page
                    .getByRole('main')
                    .locator(
                        `a[href="/${locale}/docs/web/javascript-event-loop-runtime"]`
                    )
                    .first()
            ).toBeVisible()
        }
        const atDestination = await summary()
        if (method === 'menu-link') {
            // Removing the old Link is not the same as aborting its fetch.
            expect(atDestination.responseFinished).not.toBe(true)
            expect(atDestination.responseClosed).not.toBe(true)
        }
        await control('release')
        await expect
            .poll(async () => {
                const result = await summary()
                return (
                    result.responseFinished === true ||
                    result.responseClosed === true
                )
            })
            .toBe(true)
        const after = await summary()
        const replacedDocument = method === 'document-replacement'
        expect(after.responseFinished).toBe(!replacedDocument)
        expect(after.closeBeforeFinish).toBe(replacedDocument)
        expect(after.outcome).toBe(replacedDocument ? 'unknown' : 'completed')
        const streamErrors = after.events.filter(
            (event) => event.errorCategory === 'stream'
        )
        if (!replacedDocument) expect(streamErrors).toHaveLength(0)
        else {
            // Cancellation is a transport observation, not a guaranteed log.
            const closed = after.events.find(
                (event) => event.event === 'closed'
            )
            expect(closed).toBeDefined()
            for (const error of streamErrors)
                expect(error.sequence).toBeGreaterThan(closed!.sequence)
        }
        const sameDocument = await page.evaluate(
            (value) =>
                Reflect.get(window, '__articleNavigationIdentity') === value,
            identity
        )
        expect(sameDocument).toBe(method !== 'document-replacement')
        expect(
            navigationRequests.filter((entry) => entry.kind === 'document')
        ).toHaveLength(method === 'document-replacement' ? 1 : 0)
        expect(browserErrors).toEqual([])
        const result = {
            locale,
            method,
            project: testInfo.project.name,
            repeat: testInfo.repeatEachIndex,
            prefetchStatus: response.status(),
            browserErrorCount: browserErrors.length,
            sameDocument,
            destination,
            navigationRequests,
            before,
            atDestination,
            after,
        }
        console.info('[article-navigation-comparison]', JSON.stringify(result))
        await testInfo.attach('prefetch-navigation', {
            body: JSON.stringify(result, null, 2),
            contentType: 'application/json',
        })
    } finally {
        await control('release')
    }
}

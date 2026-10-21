import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import {
    expect,
    type Locator,
    type Page,
    type TestInfo,
} from '@playwright/test'

/** Observe a real Link transition without charging server wait to UI assertions. */
export async function openArticleFromCard(
    page: Page,
    card: Locator,
    info: TestInfo
) {
    const href = await card.getAttribute('href')
    expect(href).toMatch(/^\/(ko|en)\/docs\//)
    if (!href) throw new Error('Article card is missing its destination.')
    const destination = new URL(href, page.url())
    const identity = randomUUID()
    await page.evaluate(
        (value) => Reflect.set(window, '__offlineLinkIdentity', value),
        identity
    )
    const started = performance.now()
    const events: object[] = []
    const documentRequests: string[] = []
    const failedResponses: number[] = []
    const matches = (url: string) => {
        const value = new URL(url)
        return (
            value.origin === destination.origin &&
            value.pathname === destination.pathname
        )
    }
    const request = (request: import('@playwright/test').Request) => {
        if (!matches(request.url())) return
        if (request.isNavigationRequest())
            documentRequests.push(destination.pathname)
        if (events.length < 100)
            events.push({
                event: 'request',
                ms: performance.now() - started,
                type: request.resourceType(),
                rsc: request.headers().rsc === '1',
                prefetch: request.headers()['next-router-prefetch'] === '1',
            })
    }
    const response = (response: import('@playwright/test').Response) => {
        if (!matches(response.url())) return
        if (response.status() >= 400) failedResponses.push(response.status())
        if (events.length < 100)
            events.push({
                event: 'response',
                ms: performance.now() - started,
                status: response.status(),
            })
    }
    const failed = (request: import('@playwright/test').Request) => {
        if (matches(request.url()) && events.length < 100)
            events.push({
                event: 'request-failed',
                ms: performance.now() - started,
            })
    }
    page.on('request', request)
    page.on('response', response)
    page.on('requestfailed', failed)
    try {
        // The existing test deadline bounds server wait, including a cold dev compile.
        await Promise.all([
            page.waitForURL(destination.href, { waitUntil: 'commit' }),
            card.click(),
        ])
        events.push({ event: 'url-committed', ms: performance.now() - started })
        expect(
            failedResponses,
            'Article navigation returned an HTTP error'
        ).toEqual([])
        await expect(page).toHaveURL(destination.href)
        await expect(page.locator('[data-offline-content]')).toBeVisible()
        expect(
            documentRequests,
            'The card must use client-side navigation'
        ).toEqual([])
        expect(
            await page.evaluate(
                (value) =>
                    Reflect.get(window, '__offlineLinkIdentity') === value,
                identity
            )
        ).toBe(true)
        events.push({ event: 'body-visible', ms: performance.now() - started })
    } finally {
        page.off('request', request)
        page.off('response', response)
        page.off('requestfailed', failed)
        await info.attach('offline-article-navigation', {
            contentType: 'application/json',
            body: JSON.stringify({ path: destination.pathname, events }),
        })
    }
}

import { randomUUID } from 'node:crypto'
import {
    expect,
    type Locator,
    type Page,
    type TestInfo,
} from '@playwright/test'
import { observeNavigation } from './navigation-observer'

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
    const observation = await observeNavigation(page, destination)
    try {
        // The existing test deadline bounds server wait, including a cold dev compile.
        await Promise.all([
            page.waitForURL(destination.href, { waitUntil: 'commit' }),
            card.click(),
        ])
        observation.mark('url-committed')
        expect(
            observation.failedResponses,
            'Article navigation returned an HTTP error'
        ).toEqual([])
        await expect(page).toHaveURL(destination.href)
        await expect(page.locator('[data-offline-content]')).toBeVisible()
        expect(
            observation.documentRequests,
            'The card must use client-side navigation'
        ).toEqual([])
        expect(
            await page.evaluate(
                (value) =>
                    Reflect.get(window, '__offlineLinkIdentity') === value,
                identity
            )
        ).toBe(true)
        observation.mark('body-visible')
    } finally {
        const report = await observation.stop()
        await info.attach('offline-article-navigation', {
            contentType: 'application/json',
            body: JSON.stringify(report),
        })
    }
}

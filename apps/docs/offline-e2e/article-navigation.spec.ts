import { expect, test } from '@playwright/test'
import { openArticleFromCard } from './article-navigation'

test('a delayed RSC navigation completes the UI independently of transport completion', async ({
    page,
}, info) => {
    await page.goto('/ko/web')
    const card = page.getByRole('main').locator('a[href^="/ko/docs/"]').first()
    const href = await card.getAttribute('href')
    if (!href) throw new Error('No article card')
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    let observed!: () => void
    const requestObserved = new Promise<void>((resolve) => {
        observed = resolve
    })
    await page.route(
        (url) => url.pathname === href,
        async (route) => {
            if (
                route.request().headers().rsc !== '1' ||
                route.request().headers()['next-router-prefetch'] === '1'
            )
                return route.continue()
            const response = await route.fetch()
            const body = await response.body()
            const headers = { ...response.headers() }
            // APIResponse exposes decoded bytes, not the upstream wire framing.
            for (const name of [
                'content-encoding',
                'content-length',
                'transfer-encoding',
                'connection',
            ])
                delete headers[name]
            observed()
            await gate
            await route.fulfill({ status: response.status(), headers, body })
        }
    )
    const navigation = openArticleFromCard(page, card, info)
    // Handle an early failure while the controlled response is still held.
    const completed = navigation.then(
        () => ({ error: undefined }),
        (error: unknown) => ({ error })
    )
    try {
        await requestObserved
        // App Router may commit the URL before the held article body arrives.
        // Completion below requires body visibility and observer evidence.
    } finally {
        release()
    }
    const result = await completed
    if (result.error) throw result.error
    const attachment = info.attachments.find(
        ({ name }) => name === 'offline-article-navigation'
    )
    expect(attachment?.body).toBeDefined()
    const report = JSON.parse(attachment!.body!.toString())
    expect(report.nprogress.status).toBe('observed')
    expect(
        report.nprogress.samples.some(
            (sample: { busy: boolean }) => sample.busy
        )
    ).toBe(true)
    expect(report.nprogress.samples.at(-1).busy).toBe(false)
    const headers = report.events.find(
        (event: { event: string; rsc: boolean; prefetch: boolean }) =>
            event.event === 'response-headers' && event.rsc && !event.prefetch
    )
    expect(headers?.status).toBe(200)
    const committed = report.events.find(
        (event: { event: string }) => event.event === 'url-committed'
    )
    const visible = report.events.find(
        (event: { event: string }) => event.event === 'body-visible'
    )
    expect(committed).toBeDefined()
    expect(visible).toBeDefined()
    expect(visible.ms).toBeGreaterThanOrEqual(committed.ms)
    // The unchanged report retains finished, failed and pending transport evidence.
    expect(report.droppedEvents).toBe(0)
})

test('an HTTP failure is not mistaken for successful article navigation', async ({
    page,
}, info) => {
    await page.goto('/ko/web')
    const card = page.getByRole('main').locator('a[href^="/ko/docs/"]').first()
    const href = await card.getAttribute('href')
    if (!href) throw new Error('No article card')
    await page.route(
        (url) => url.pathname === href,
        (route) =>
            route.fulfill({
                status: 503,
                contentType: 'text/html',
                body: '<h1>Controlled article failure</h1>',
            })
    )
    await expect(openArticleFromCard(page, card, info)).rejects.toThrow(
        /HTTP error/
    )
})

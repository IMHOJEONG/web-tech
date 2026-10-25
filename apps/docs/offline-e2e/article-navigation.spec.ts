import { expect, test } from '@playwright/test'
import { openArticleFromCard } from './article-navigation'

test('a healthy delayed RSC response does not consume the post-commit UI budget', async ({
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
        await expect(
            expect(page).toHaveURL(new URL(href, page.url()).href)
        ).rejects.toThrow(/toHaveURL/)
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
    expect(
        report.events.some(
            (event: { event: string; requestId: number }) =>
                event.event === 'response-finished' &&
                event.requestId === headers.requestId
        )
    ).toBe(true)
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

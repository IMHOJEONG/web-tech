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
            observed()
            await gate
            await route.fulfill({ response })
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

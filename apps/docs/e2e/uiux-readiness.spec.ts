import { expect, test } from '@playwright/test'
import { holdPageCompletion } from './helpers/streamed-docs-index'
import { expectUiUxHubReady, readyUiUxHub } from './helpers/uiux-hub'

for (const locale of ['ko', 'en']) {
    test(
        locale + ': streamed UI/UX fallback is not a ready article list',
        async ({ page, baseURL }) => {
            const target = new URL('/' + locale + '/ui-ux', baseURL).href
            const stream = await holdPageCompletion(page, target, {
                pending: 'ui-ux',
                ready: 'uiux-featured-articles',
            })
            try {
                await page.goto(target, { waitUntil: 'commit' })
                const pending = page.getByTestId('content-pending')
                await expect(pending).toBeVisible()
                await expect(pending).toHaveAttribute('aria-busy', 'true')
                // These absence checks passed on the previous fallback.
                await expect(
                    pending.getByText(/UI\/UX 뉴스레터|THE UX NEWSLETTER/)
                ).toHaveCount(0)
                await expect(pending.locator('input, button')).toHaveCount(0)
                await expect(readyUiUxHub(page)).toHaveCount(0)
                const fallbackNode = await pending.elementHandle()
                const ready = expectUiUxHubReady(page)
                stream.release()
                const main = await ready
                await expect(
                    main.getByTestId('uiux-featured-articles').getByRole('link')
                ).toHaveCount(3)
                expect(
                    await fallbackNode!.evaluate((node) => node.isConnected)
                ).toBe(false)
                const card = main
                    .getByTestId('uiux-featured-articles')
                    .getByRole('link')
                    .first()
                const href = await card.getAttribute('href')
                expect(href).toBeTruthy()
                await card.focus()
                await expect(card).toBeFocused()
                await card.press('Enter')
                await expect(page).toHaveURL(new URL(href!, target).href)
            } finally {
                await stream.dispose()
            }
        }
    )
}

for (const scenario of ['missing', 'duplicate', 'pending'] as const) {
    test(
        'readiness rejects a ' + scenario + ' synthetic UI/UX main',
        async ({ page }) => {
            const ready =
                '<main><section data-testid="uiux-featured-articles"><a href="/article">Fixture</a></section></main>'
            await page.setContent(
                scenario === 'missing'
                    ? '<main>No articles</main>'
                    : scenario === 'duplicate'
                      ? ready + ready
                      : '<main data-testid="content-pending" aria-busy="true">Loading</main>' +
                        ready
            )
            await expect(expectUiUxHubReady(page)).rejects.toThrow()
        }
    )
}

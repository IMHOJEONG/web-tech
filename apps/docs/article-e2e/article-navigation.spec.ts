import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { articles, expectCompleteArticle } from './article-fixtures.ts'

for (const locale of ['ko', 'en']) {
    for (const article of articles) {
        test(`Link navigation: ${locale} ${article.name} renders a complete article without document reload`, async ({
            page,
        }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            const destination = `/${locale}${article.path}`
            // Direct access only bootstraps the source; the tested move is a click.
            await page.goto(
                `/${locale}/docs?q=${encodeURIComponent(article.title)}`
            )
            const card = page
                .getByRole('main')
                .locator(`a[href="${destination}"]`)
            await expect(card).toHaveCount(1)
            await expect(
                page.getByTestId('mobile-nav-drawer-trigger')
            ).toBeEnabled()
            const identity = randomUUID()
            await page.evaluate(
                (value) => Reflect.set(window, '__articleLinkIdentity', value),
                identity
            )
            const documentRequests: string[] = []
            page.on('request', (request) => {
                if (
                    request.isNavigationRequest() &&
                    request.frame() === page.mainFrame()
                )
                    documentRequests.push(new URL(request.url()).pathname)
            })
            await card.click()
            await expect(page).toHaveURL(destination)
            await expectCompleteArticle(page, article)
            expect(
                await page.evaluate(
                    (value) =>
                        Reflect.get(window, '__articleLinkIdentity') === value,
                    identity
                )
            ).toBe(true)
            expect(documentRequests).toEqual([])
            expect(errors, 'Unhandled browser errors').toEqual([])
        })
    }
}

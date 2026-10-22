import { expect, test } from '@playwright/test'
import { articles, expectCompleteArticle } from './article-fixtures.ts'

for (const locale of ['ko', 'en']) {
    for (const article of articles) {
        test(`direct URL: ${locale} ${article.name} renders complete body on access and reload`, async ({
            page,
        }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            const path = `/${locale}${article.path}`
            const response = await page.goto(path)
            expect(response?.status()).toBe(200)
            await expect(page).toHaveURL(path)
            await expectCompleteArticle(page, article)
            const reloaded = await page.reload()
            expect(reloaded?.status()).toBe(200)
            await expectCompleteArticle(page, article)
            expect(errors, 'Unhandled browser errors').toEqual([])
        })
    }

    test(`direct URL: ${locale} missing document renders not-found instead of an empty article`, async ({
        page,
    }) => {
        // A streamed not-found response can be HTTP 200; inspect the actual UI.
        await page.goto(`/${locale}/docs/web/article-e2e-missing`)
        await expect(
            page.getByRole('heading', {
                name: '요청한 문서를 찾지 못했습니다',
                exact: true,
            })
        ).toBeVisible()
        await expect(page.locator('.mdx-wrapper')).toHaveCount(0)
        await expect(
            page.locator('script[type="application/ld+json"]')
        ).toHaveCount(0)
        await expect(page.getByTestId('article-pending')).toHaveCount(0)
    })
}

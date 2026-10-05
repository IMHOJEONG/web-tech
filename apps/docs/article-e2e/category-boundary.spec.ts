import { expect, test } from '@playwright/test'

const rejectedPaths = [
    '/ko/category/unknown',
    '/ko/category/fe/node-js',
    '/ko/category/fe/%7Breact%2Cbrowser%7D',
    '/ko/category/%7Bfe%2Cbe%7D/react',
    '/ko/category/fe/*/server-client-component-boundary',
    '/en/category/fe/React',
]

for (const path of rejectedPaths) {
    test(`rejects unconfigured category: ${path}`, async ({ page }) => {
        // Streaming may send HTTP 200 before notFound; assert the hydrated UI.
        await page.goto(path)
        await expect(
            page.getByRole('heading', {
                name: '요청한 문서를 찾지 못했습니다',
                exact: true,
            })
        ).toBeVisible()
        await expect(
            page.locator('meta[name="robots"][content*="noindex"]').first()
        ).toBeAttached()
        await expect(page.locator('.mdx-wrapper')).toHaveCount(0)
    })
}

for (const path of [
    '/ko/category/fe',
    '/ko/category/fe/react',
    '/en/category/be/node-js',
]) {
    test(`preserves configured category: ${path}`, async ({ page }) => {
        const response = await page.goto(path)
        expect(response?.status()).toBe(200)
        await expect(page.locator('main h1')).toBeVisible()
        await expect(
            page.getByRole('heading', {
                name: '요청한 문서를 찾지 못했습니다',
                exact: true,
            })
        ).toHaveCount(0)
        await expect(
            page.locator('meta[name="robots"][content*="noindex"]')
        ).toHaveCount(0)
    })
}

test('configured legacy detail still redirects to the canonical article', async ({
    page,
}) => {
    await page.goto('/ko/category/fe/react/server-client-component-boundary')
    await expect(page).toHaveURL(
        '/ko/docs/category/fe/react/server-client-component-boundary'
    )
    await expect(
        page.locator('.mdx-wrapper').getByRole('heading', {
            name: '경계를 먼저 정해야 하는 이유',
            exact: true,
        })
    ).toBeVisible()
})

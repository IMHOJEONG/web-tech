import { expect, test } from '@playwright/test'

test('Korean landing uses distinct label and natural recent-article heading', async ({
    page,
}) => {
    await page.goto('/ko')
    const main = page.locator('main')
    await expect(main.getByText('기술 기록', { exact: true })).toBeVisible()
    await expect(
        main.getByRole('heading', { name: '새로 올라온 글', exact: true })
    ).toBeVisible()
    await expect(
        main.getByRole('heading', { name: '최근에 정리한 글', exact: true })
    ).toHaveCount(0)
})

test('English recent-article heading remains unchanged', async ({ page }) => {
    await page.goto('/en')
    await expect(
        page.locator('main').getByRole('heading', {
            name: 'Recently refined articles',
            exact: true,
        })
    ).toBeVisible()
})

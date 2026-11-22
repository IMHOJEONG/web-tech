import { expect, type Page } from '@playwright/test'

export function readyUiUxHub(page: Page) {
    return page.locator('main:visible').filter({
        has: page.getByTestId('uiux-featured-articles'),
    })
}

export async function expectUiUxHubReady(page: Page) {
    const main = readyUiUxHub(page)
    await expect(main).toHaveCount(1)
    await expect(main).toBeVisible()
    await expect(page.getByTestId('content-pending')).toHaveCount(0)
    await expect(page.getByRole('main')).toHaveCount(1)
    return main
}

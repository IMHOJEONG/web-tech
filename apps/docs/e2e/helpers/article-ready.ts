import { expect, type Page } from '@playwright/test'

export async function waitForArticleBody(page: Page) {
    // Loading and completed content both expose a main landmark.
    await expect(page.locator('.mdx-wrapper')).toBeVisible()
    await expect(page.locator('[data-page-pending="article"]')).toHaveCount(0)
}

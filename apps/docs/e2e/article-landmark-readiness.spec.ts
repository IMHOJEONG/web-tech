import assert from 'node:assert/strict'
import { expect, test } from '@playwright/test'
import { actualMainCount } from '../scripts/article-main-diagnostic'
import { waitForArticleBody } from './helpers/article-ready'

// Each fixture starts in a blank page, never in React-owned application DOM.
test('article readiness waits for visible body and removal of the loading landmark', async ({
    page,
}) => {
    await page.setContent('<main data-page-pending="article">Loading</main>')
    await expect(page.getByRole('main')).toHaveCount(1)
    let settled = false
    const ready = waitForArticleBody(page).then(() => {
        settled = true
    })
    try {
        expect(settled).toBe(false)
        await page.evaluate(() => {
            const main = document.createElement('main')
            main.innerHTML = '<div class="mdx-wrapper">Synthetic body</div>'
            document.body.append(main)
        })
        await expect(page.locator('.mdx-wrapper')).toBeVisible()
        await expect(page.getByRole('main')).toHaveCount(2)
        expect(settled).toBe(false)
        await page
            .locator('[data-page-pending="article"]')
            .evaluate((element) => element.remove())
        await ready
        await expect(page.getByRole('main')).toHaveCount(1)
    } finally {
        await ready.catch(() => {})
    }
})

test('completed article still rejects duplicate accessible main landmarks', async ({
    page,
}) => {
    await page.setContent(
        '<main><div class="mdx-wrapper">Synthetic body</div></main><main></main>'
    )
    await waitForArticleBody(page)
    await assert.rejects(
        () => expect(page.getByRole('main')).toHaveCount(1),
        (error) => actualMainCount(error) === 2
    )
})

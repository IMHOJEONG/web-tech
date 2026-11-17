import assert from 'node:assert/strict'
import { expect, test } from '@playwright/test'
import { actualMainCount } from '../scripts/article-main-diagnostic'
import { waitForArticleBody } from './helpers/article-ready'

// These are synthetic blank pages, not mutations of an application's React DOM.
test('visible article body never substitutes for a missing main landmark', async ({
    page,
}) => {
    await page.setContent('<div class="mdx-wrapper">Synthetic body</div>')
    await waitForArticleBody(page)
    await assert.rejects(
        () => expect(page.getByRole('main')).toHaveCount(1),
        (error) => actualMainCount(error) === 0
    )
})

test('hidden body and an error shell never qualify as completed article readiness', async ({
    page,
}) => {
    for (const html of [
        '<main><div hidden><div class="mdx-wrapper">Hidden synthetic body</div></div></main>',
        '<main role="alert">Synthetic unavailable</main>',
    ]) {
        await page.setContent(html)
        await assert.rejects(() => waitForArticleBody(page), /toBeVisible/)
    }
})

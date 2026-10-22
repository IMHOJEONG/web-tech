import { expect, test } from '@playwright/test'
import { observeNavigation } from '../offline-e2e/navigation-observer'

test('controlled trace retention failure', async ({ page }, info) => {
    await page.setContent('<main>Public evidence fixture</main>')
    const observation = await observeNavigation(
        page,
        new URL('https://fixture.invalid/article')
    )
    await page.evaluate(() => {
        document.documentElement.classList.add('nprogress-busy')
        document.documentElement.classList.remove('nprogress-busy')
    })
    await info.attach('offline-article-navigation', {
        contentType: 'application/json',
        body: JSON.stringify(await observation.stop()),
    })
    await expect(page.getByRole('main')).toHaveText(
        '__EXPECTED_RETENTION_PROBE_FAILURE__',
        { timeout: 100 }
    )
})

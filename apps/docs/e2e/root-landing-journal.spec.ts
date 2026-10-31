import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: home prioritizes recent writing and working topic links`, async ({
            page,
        }) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}`)
            const introduction = page.getByTestId('landing-introduction')
            await expect(
                introduction.getByRole('heading', { level: 1 })
            ).toHaveText(
                locale === 'ko'
                    ? '개발하며 배운 것들'
                    : 'Notes from building software'
            )
            await expect(page.locator('html')).toHaveClass(
                theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
            )
            await expect(
                introduction.locator('.ds-button-primary')
            ).toHaveAttribute('href', `/${locale}/docs`)

            const recent = page.getByTestId('landing-latest-notes')
            const topics = page.getByTestId('landing-topics')
            const cards = recent.locator('li > a')
            await expect(cards).toHaveCount(4)
            await expect(recent.getByText('OPEN', { exact: true })).toHaveCount(
                0
            )
            await expect(recent.locator('img')).toHaveCount(0)
            await expect(topics.getByRole('link')).toHaveCount(3)
            const recentBounds = (await recent.boundingBox())!
            expect((await topics.boundingBox())!.y).toBeGreaterThanOrEqual(
                recentBounds.y + recentBounds.height
            )
            expect((await cards.first().boundingBox())!.y).toBeLessThan(
                page.viewportSize()!.height
            )
            const destinations = await cards.evaluateAll((links) =>
                links.map((link) => link.getAttribute('href'))
            )
            expect(new Set(destinations).size).toBe(4)
            const first = cards.first()
            const href = (await first.getAttribute('href'))!
            await first.focus()
            await first.press('Enter')
            await expect(page).toHaveURL(new URL(href, page.url()).href)
            await page.goBack()
            await topics.getByRole('link', { name: /Backend/ }).click()
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?section=backend$`)
            )
            await expect(
                page
                    .getByTestId('docs-index-results')
                    .locator('article')
                    .first()
            ).toBeVisible()
        })
    }
}

test('home remains inside narrow and intermediate viewports', async ({
    page,
}) => {
    test.skip(page.viewportSize()!.width !== 1280, 'Run width sweep once.')
    await page.goto('/en')
    await expect(
        page.getByTestId('landing-latest-notes').locator('li > a').first()
    ).toBeVisible()
    for (const width of [320, 390, 640, 768, 1024]) {
        await page.setViewportSize({ width, height: 844 })
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth
            )
        ).toBe(0)
        for (const link of await page
            .getByTestId('landing-topics')
            .getByRole('link')
            .all()) {
            const bounds = (await link.boundingBox())!
            expect(bounds.height).toBeGreaterThanOrEqual(44)
            expect(bounds.x).toBeGreaterThanOrEqual(0)
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        }
    }
})

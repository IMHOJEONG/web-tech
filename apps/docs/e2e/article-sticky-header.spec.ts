import { expect, test } from '@playwright/test'

test('header stays visible through the full article scroll range', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/docs/web/javascript-event-loop-runtime')
    await expect(page.locator('.mdx-wrapper')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const height = await page.evaluate(() => ({
        document: document.documentElement.scrollHeight,
        viewport: window.innerHeight,
        width: window.innerWidth,
    }))
    expect(height.document).toBeGreaterThan(height.viewport)

    for (const fraction of [0, 0.5, 1, 0]) {
        await page.evaluate((ratio) => {
            window.scrollTo({
                top:
                    (document.documentElement.scrollHeight - innerHeight) *
                    ratio,
                behavior: 'instant',
            })
        }, fraction)
        if (fraction > 0) {
            await expect
                .poll(() => page.evaluate(() => scrollY))
                .toBeGreaterThan(0)
        }
        await expect
            .poll(() =>
                page.locator('header').evaluate((header) => {
                    const rect = header.getBoundingClientRect()
                    return {
                        top: Math.round(rect.top),
                        height: Math.round(rect.height),
                    }
                })
            )
            .toEqual({ top: 0, height: 65 })
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(height.width)
    }
})

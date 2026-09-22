import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        test(`${theme}/${reducedMotion}: leaving the mobile shell releases the drawer`, async ({
            page,
        }, info) => {
            test.skip(
                info.project.name !== 'chromium-mobile',
                'Mobile shell transition coverage.'
            )
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion })
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            await page.goto('/ko/about')

            const trigger = page.getByTestId('mobile-nav-drawer-trigger')
            const drawer = page.getByRole('dialog')
            const overlay = page.locator('[data-slot="sheet-overlay"]')

            for (const width of [640, 844]) {
                await page.setViewportSize({ width: 390, height: 844 })
                await expect(trigger).toBeVisible()
                await expect(drawer).toHaveCount(0)
                await trigger.click()
                await expect(drawer).toBeVisible()

                await page.setViewportSize({ width: 639, height: 844 })
                await expect(drawer).toBeVisible()
                await page.setViewportSize({ width, height: 390 })
                await expect(trigger).toBeHidden()
                await expect(drawer).toHaveCount(0)
                await expect(overlay).toHaveCount(0)

                const desktopLink = page
                    .getByTestId('desktop-navigation')
                    .getByRole('link')
                    .first()
                await desktopLink.focus()
                await expect(desktopLink).toBeFocused()
                const scrollBefore = await page.evaluate(() => window.scrollY)
                await page.mouse.move(width - 20, 300)
                await page.mouse.wheel(0, 200)
                await expect
                    .poll(() => page.evaluate(() => window.scrollY))
                    .toBeGreaterThan(scrollBefore)

                await page.setViewportSize({ width: 390, height: 844 })
                await expect(drawer).toHaveCount(0)
                await expect(overlay).toHaveCount(0)
                await trigger.click()
                await expect(drawer).toBeVisible()
                await page.keyboard.press('Escape')
                await expect(drawer).toHaveCount(0)
                await expect(trigger).toBeFocused()
            }
            expect(errors).toEqual([])
        })
    }
}

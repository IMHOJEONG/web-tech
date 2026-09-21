import { expect, test } from '@playwright/test'

for (const theme of ['light', 'dark']) {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        test(`${theme}/${reducedMotion}: mobile drawer has one custom close button and restores focus`, async ({
            page,
        }, info) => {
            test.skip(
                info.project.name !== 'chromium-mobile',
                'Mobile drawer coverage.'
            )
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion })
            await page.goto('/ko/about')
            if (theme === 'dark')
                await expect(page.locator('html')).toHaveClass(/\bdark\b/)
            else await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)

            const trigger = page.getByTestId('mobile-nav-drawer-trigger')
            const drawer = page.getByRole('dialog')
            await trigger.click()
            const close = drawer.getByRole('button', {
                name: '내비게이션 메뉴 닫기',
                exact: true,
            })
            await expect(close).toHaveCount(1)
            await expect(close).toBeVisible()
            await expect(
                drawer.getByRole('button', { name: 'Close', exact: true })
            ).toHaveCount(0)
            await expect(drawer.locator(':scope > button')).toHaveCount(0)
            await close.click()
            await expect(drawer).toHaveCount(0)
            await expect(trigger).toBeFocused()
            await expect(
                page.locator('[data-slot="sheet-overlay"]')
            ).toHaveCount(0)

            await trigger.press('Enter')
            await expect(drawer).toBeVisible()
            await page.keyboard.press('Escape')
            await expect(drawer).toHaveCount(0)
            await expect(trigger).toBeFocused()
            await expect(
                page.locator('[data-slot="sheet-overlay"]')
            ).toHaveCount(0)
        })
    }
}

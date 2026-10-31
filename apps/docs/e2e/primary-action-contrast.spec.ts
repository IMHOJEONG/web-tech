import { expect, test } from '@playwright/test'
import { solidContrast } from '../ui-e2e/helpers/solid-contrast'

for (const theme of ['light', 'dark']) {
    test(`${theme}: landing primary CTA contrast and keyboard navigation`, async ({
        page,
    }, testInfo) => {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.goto('/ko')
        await expect
            .poll(() =>
                page
                    .locator('html')
                    .evaluate((el) => el.classList.contains('dark'))
            )
            .toBe(theme === 'dark')
        await page.evaluate(() => document.fonts.ready)
        const action = page.locator('main a.ds-button-primary').first()
        await expect(action).toHaveAccessibleName(/.+/)
        await expect(action).toHaveAttribute('href', '/ko/docs')
        const normal = await solidContrast(action)
        expect(normal.ratio).toBeGreaterThanOrEqual(4.5)
        await action.hover()
        await expect
            .poll(() =>
                action.evaluate(
                    (el) =>
                        el
                            .getAnimations()
                            .filter((a) => a.playState === 'running').length
                )
            )
            .toBe(0)
        const hover = await solidContrast(action)
        expect(hover.ratio).toBeGreaterThanOrEqual(4.5)
        await page.mouse.move(0, 0)
        // Reach the CTA through the real focus order rather than injecting focus.
        for (
            let step = 0;
            step < 30 &&
            !(await action.evaluate((el) => el === document.activeElement));
            step++
        )
            await page.keyboard.press('Tab')
        await expect(action).toBeFocused()
        await expect(action).toHaveCSS('outline-style', 'solid')
        await expect(action).toHaveCSS('outline-width', '2px')
        await expect
            .poll(() =>
                action.evaluate(
                    (el) =>
                        el
                            .getAnimations()
                            .filter((a) => a.playState === 'running').length
                )
            )
            .toBe(0)
        const focus = await solidContrast(action, true)
        const focusText = await solidContrast(action)
        expect(focus.ratio).toBeGreaterThanOrEqual(3)
        expect(focusText.ratio).toBeGreaterThanOrEqual(4.5)
        await testInfo.attach('primary-cta.json', {
            body: JSON.stringify({
                theme,
                viewport: page.viewportSize(),
                normal,
                hover,
                focus,
                focusText,
            }),
            contentType: 'application/json',
        })
        await testInfo.attach('primary-cta.png', {
            body: await page.screenshot(),
            contentType: 'image/png',
        })
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(/\/ko\/docs$/)
        await expect(page.locator('main')).toBeVisible()
    })
}

import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: header navigation and search remain usable`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/web`)
            if (theme === 'dark') {
                await expect(page.locator('html')).toHaveClass(/\bdark\b/)
            } else {
                await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
            }
            const header = page.locator('header')
            const trigger = header.locator(
                'form button[aria-expanded][aria-controls]'
            )
            const input = header.getByRole('textbox')
            const width = page.viewportSize()!.width
            await expect(trigger).toBeVisible()
            await expect(trigger).toHaveAccessibleName(
                locale === 'ko' ? '문서 검색' : 'Search docs'
            )
            if (width >= 1024) {
                await expect(trigger.locator('span')).toBeVisible()
            } else {
                await expect(trigger.locator('span')).toBeHidden()
            }
            await expect(header).toHaveCSS('height', '65px')
            if (width >= 640) {
                const nav = page.getByTestId('desktop-navigation')
                await expect(nav.locator('[aria-current="page"]')).toHaveText(
                    'Web'
                )
                const active = nav.getByRole('link', {
                    name: 'Web',
                    exact: true,
                })
                expect(
                    await active.evaluate(
                        (element) =>
                            getComputedStyle(element, '::after').backgroundColor
                    )
                ).not.toBe('rgba(0, 0, 0, 0)')
                await nav
                    .getByRole('link', { name: 'About', exact: true })
                    .click()
                await expect(nav.locator('[aria-current="page"]')).toHaveText(
                    'About'
                )
            } else {
                await page.getByTestId('mobile-nav-drawer-trigger').click()
                const drawer = page.getByRole('dialog')
                await expect(
                    drawer.locator('[aria-current="page"]')
                ).toHaveText('Web')
                await drawer
                    .getByRole('link', { name: 'About', exact: true })
                    .click()
                await expect(drawer).toBeHidden()
            }
            await expect(page).toHaveURL(new RegExp(`/${locale}/about$`))
            await header.screenshot({ path: testInfo.outputPath('header.png') })
            await trigger.click()
            await expect(input).toBeFocused()
            await expect(trigger).toHaveAttribute('aria-expanded', 'true')
            await input.press('Escape')
            await expect(trigger).toBeFocused()
            await expect(input).toBeHidden()
            await trigger.press('Enter')
            await input.fill('react')
            await input.press('Enter')
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?q=react$`)
            )
        })
    }
}

test('header and expanded search fit narrow and breakpoint widths', async ({
    page,
}) => {
    test.skip(page.viewportSize()?.width !== 1280, 'Run width sweep once.')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en/web')
    for (const width of [320, 390, 640, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 844 })
        const header = page.locator('header')
        const trigger = header.locator(
            'form button[aria-expanded][aria-controls]'
        )
        await trigger.click()
        const input = header.getByRole('textbox')
        await expect(input).toBeVisible()
        const panelId = await trigger.getAttribute('aria-controls')
        const bounds = await page.locator(`[id="${panelId}"]`).boundingBox()
        expect(bounds).not.toBeNull()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width)
        const links = await header.locator('a:visible').all()
        const rectangles = []
        for (const link of links) rectangles.push((await link.boundingBox())!)
        rectangles.push((await trigger.boundingBox())!)
        rectangles.sort((left, right) => left.x - right.x)
        for (let index = 1; index < rectangles.length; index++) {
            expect(
                rectangles[index - 1]!.x + rectangles[index - 1]!.width
            ).toBeLessThanOrEqual(rectangles[index]!.x + 1)
        }
        await input.press('Escape')
    }
})

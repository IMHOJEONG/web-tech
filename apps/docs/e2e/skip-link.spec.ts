import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: first Tab skips the shell on public pages`, async ({
        page,
    }) => {
        test.setTimeout(120_000)
        for (const route of [
            '',
            '/feed',
            '/web',
            '/mobile',
            '/ui-ux',
            '/about',
            '/docs',
            '/docs?q=react',
            '/docs?q=unmatched-keyword-xyz',
            '/category',
            '/category/fe',
            '/category/fe/react',
            '/docs/category/fe/react/server-client-component-boundary',
            '/privacy',
            '/docs/missing-accessibility-check',
        ]) {
            await page.goto(`/${locale}${route}`)
            const main = page.getByRole('main')
            await expect(
                main,
                `Main landmark at /${locale}${route}`
            ).toHaveCount(1)
            await expect(main).not.toHaveAttribute('aria-busy', 'true')
            await expect(page.locator('#main-content')).toHaveCount(1)
            const skip = page.getByRole('link', {
                name:
                    locale === 'ko'
                        ? '본문으로 바로가기'
                        : 'Skip to main content',
                exact: true,
            })
            await expect(skip).toHaveCSS('width', '1px')
            await expect(skip).toHaveCSS('height', '1px')
            await page.keyboard.press('Tab')
            await expect(skip).toBeFocused()
            const bounds = await skip.boundingBox()
            expect(bounds!.width).toBeGreaterThan(40)
            expect(bounds!.height).toBeGreaterThan(24)
            await page.keyboard.press('Enter')
            await expect(main).toBeFocused()
            const headerBottom = await page
                .getByRole('banner')
                .evaluate((el) => el.getBoundingClientRect().bottom)
            const mainTop = await main.evaluate(
                (el) => el.getBoundingClientRect().top
            )
            expect(mainTop).toBeGreaterThanOrEqual(headerBottom - 1)
            const firstControl = main
                .locator(
                    'a[href]:visible, button:visible, input:visible, [tabindex="0"]:visible'
                )
                .first()
            if (await firstControl.count()) {
                await page.keyboard.press('Tab')
                await expect(firstControl).toBeFocused()
            }
        }
    })
}

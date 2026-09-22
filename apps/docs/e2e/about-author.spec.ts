import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: About ends with a single author section`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/about`)
            const main = page.getByRole('main')
            const author = page.getByTestId('about-author')
            await expect(
                author.getByRole('heading', { name: 'HoJeong Im' })
            ).toBeVisible()
            await expect(
                main.getByText('TWITTER/X', { exact: true })
            ).toHaveCount(0)
            await expect(main.locator('article')).toHaveCount(3)
            for (const title of await main
                .locator('article h2')
                .allTextContents()) {
                await expect(
                    main.getByText(title, { exact: true })
                ).toHaveCount(1)
            }
            const github = author.getByRole('link', {
                name: 'GITHUB',
                exact: true,
            })
            await expect(author.getByRole('link')).toHaveCount(1)
            await expect(github).toHaveAttribute(
                'href',
                'https://github.com/IMHOJEONG'
            )
            await expect(github).toHaveAttribute('target', '_blank')
            await expect(github).toHaveAttribute('rel', 'noopener noreferrer')
            await expect(author.locator('.lucide-arrow-up-right')).toHaveCount(
                0
            )
            expect((await github.boundingBox())!.height).toBeGreaterThanOrEqual(
                44
            )
            await page.keyboard.press('Tab')
            await github.focus()
            await expect(github).toBeFocused()
            expect(
                await github.evaluate((element) =>
                    element.matches(':focus-visible')
                )
            ).toBe(true)
            await expect(github).not.toHaveCSS('box-shadow', 'none')
            expect(
                await author.evaluate(
                    (element) => element.scrollWidth <= element.clientWidth
                )
            ).toBe(true)
            await author.screenshot({
                path: testInfo.outputPath('about-author.png'),
            })
        })
    }
}

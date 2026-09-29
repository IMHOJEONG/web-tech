import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: About ends with a single author section`, async ({
            page,
        }, testInfo) => {
            const missingMessages: string[] = []
            page.on('console', (message) => {
                if (
                    message.type() === 'error' &&
                    message.text().includes('MISSING_MESSAGE')
                ) {
                    missingMessages.push(message.text())
                }
            })
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/about`)
            const main = page.getByRole('main')
            await expect(main).toHaveCount(1)
            await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1)
            await expect(
                main.getByText(
                    locale === 'ko' ? 'HEAP-FORGE 소개' : 'About HEAP-FORGE',
                    { exact: true }
                )
            ).toBeVisible()
            await expect(
                main.getByText(
                    /VERSION\s*2\.0\.4|STATUS:\s*LIVE|운영 중|Full Stack Engineer|2026년 9월부터|ESTABLISHED SEPTEMBER/
                )
            ).toHaveCount(0)
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth
                )
            ).toBe(true)
            await main
                .locator('section')
                .first()
                .screenshot({
                    path: testInfo.outputPath('about-intro.png'),
                })
            const author = page.getByTestId('about-author')
            await expect(
                author.getByText(
                    locale === 'ko'
                        ? '개발하면서 겪은 문제와 해결 과정을 기록합니다.'
                        : 'I write about the problems I encounter while developing software and how I solve them.',
                    { exact: false }
                )
            ).toBeVisible()
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
            expect(missingMessages).toEqual([])
        })
    }
}

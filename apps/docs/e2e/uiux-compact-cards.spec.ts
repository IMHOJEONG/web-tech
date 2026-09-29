import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: UI/UX images stay compact and cards open with mouse and keyboard`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/ui-ux`)
            const main = page.getByRole('main')
            await expect(
                main.getByText(/UI\/UX 뉴스레터|THE UX NEWSLETTER/)
            ).toHaveCount(0)
            await expect(main.locator('input, button')).toHaveCount(0)
            const featured = page.getByTestId('uiux-featured-articles')
            const tutorial = page.getByTestId('uiux-tutorial-card')
            await expect(featured.getByRole('link')).toHaveCount(2)
            await expect(tutorial).toHaveCount(0)
            await expect(page.getByTestId('uiux-more-articles')).toHaveCount(0)
            const feedLink = main.getByRole('link', {
                name:
                    locale === 'ko'
                        ? 'UI/UX 피드 보기'
                        : 'Browse the UI/UX feed',
                exact: true,
            })
            await expect(feedLink).toHaveAttribute(
                'href',
                `/${locale}/feed?topic=uiux`
            )
            await expect(
                main.locator('a[href*="/feed?topic=uiux"]')
            ).toHaveCount(1)
            const cards = await featured.getByRole('link').all()
            const width = page.viewportSize()!.width
            for (const card of cards) {
                await expect(card).toHaveAttribute(
                    'href',
                    new RegExp(`^/${locale}/docs/ui-ux/`)
                )
                await expect(card.locator('img')).toHaveCount(1)
                await expect(card.locator('svg, button, a')).toHaveCount(0)
                const heading = card.getByRole('heading', { level: 2 })
                await expect(card).toHaveAccessibleName(
                    await heading.innerText()
                )
                const image = (await card.locator('img').boundingBox())!
                expect(image.height).toBeLessThanOrEqual(192)
                if (width >= 768) expect(image.width).toBeLessThanOrEqual(288)
                const bounds = (await card.boundingBox())!
                expect(bounds.x).toBeGreaterThanOrEqual(0)
                expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
                expect(
                    await card.evaluate(
                        (element) => element.scrollWidth <= element.clientWidth
                    )
                ).toBe(true)
            }
            if (theme === 'dark')
                await expect(page.locator('html')).toHaveClass(/\bdark\b/)
            else await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)

            const first = featured.getByRole('link').first()
            await first.scrollIntoViewIfNeeded()
            await expect
                .poll(() =>
                    first
                        .locator('img')
                        .evaluate(
                            (img: HTMLImageElement) =>
                                img.complete && img.naturalWidth > 0
                        )
                )
                .toBe(true)
            await first.screenshot({
                path: testInfo.outputPath('uiux-card.png'),
            })
            const href = (await first.getAttribute('href'))!
            await first.click({ position: { x: 8, y: 8 } })
            await expect(page).toHaveURL(new URL(href, page.url()).href)
            await page.goBack()
            await first.focus()
            await first.press('Enter')
            await expect(page).toHaveURL(new URL(href, page.url()).href)

            await page.goBack()
            await feedLink.click()
            await expect(page).toHaveURL(
                new URL(`/${locale}/feed?topic=uiux`, page.url()).href
            )
        })
    }
}

test('UI/UX cards fit 320px and intermediate widths', async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1280, 'Run width sweep once.')
    await page.goto('/ko/ui-ux')
    for (const width of [320, 640, 1024]) {
        await page.setViewportSize({ width, height: 844 })
        const cards = page.locator(
            '[data-testid="uiux-featured-articles"] > a, [data-testid="uiux-tutorial-card"] > a'
        )
        await expect(cards).toHaveCount(2)
        for (const card of await cards.all()) {
            expect(
                await card.evaluate(
                    (element) => element.scrollWidth <= element.clientWidth
                )
            ).toBe(true)
            expect(
                (await card.boundingBox())!.x +
                    (await card.boundingBox())!.width
            ).toBeLessThanOrEqual(width)
        }
    }
})

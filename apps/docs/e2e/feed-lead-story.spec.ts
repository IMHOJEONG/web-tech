import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: compact lead card opens through image, whitespace and keyboard`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/feed`)
            const section = page.getByTestId('feed-lead-story')
            const card = section.getByRole('link')
            const heading = card.getByRole('heading', { level: 1 })
            const thumbnail = card.locator('img')

            await expect(card).toHaveCount(1)
            await expect(heading).toBeVisible()
            await expect(card).toHaveAccessibleName(
                (await heading.innerText()).trim()
            )
            await expect(card.locator('a, button, input')).toHaveCount(0)
            await expect(card.locator('svg')).toHaveCount(0)
            await expect(
                section.getByText('READ ARTICLE', { exact: true })
            ).toHaveCount(0)
            await expect(
                section.getByText(
                    locale === 'ko' ? '먼저 읽어볼 글' : 'Featured article',
                    { exact: true }
                )
            ).toBeVisible()
            await expect(thumbnail).toHaveCount(1)
            await expect(thumbnail).toHaveAttribute('alt', '')
            await expect
                .poll(() =>
                    thumbnail.evaluate(
                        (img: HTMLImageElement) =>
                            img.complete && img.naturalWidth > 0
                    )
                )
                .toBe(true)
            if (theme === 'dark') {
                await expect(page.locator('html')).toHaveClass(/\bdark\b/)
            } else {
                await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
            }

            const width = page.viewportSize()!.width
            const imageBounds = (await thumbnail.boundingBox())!
            const cardBounds = (await card.boundingBox())!
            const headingBounds = (await heading.boundingBox())!
            expect(imageBounds.height).toBeLessThanOrEqual(192)
            expect(cardBounds.x).toBeGreaterThanOrEqual(0)
            expect(cardBounds.x + cardBounds.width).toBeLessThanOrEqual(width)
            if (width >= 768) {
                expect(imageBounds.x).toBeGreaterThan(
                    headingBounds.x + headingBounds.width
                )
                expect(imageBounds.width).toBeLessThanOrEqual(288)
            } else {
                expect(imageBounds.y).toBeGreaterThan(
                    headingBounds.y + headingBounds.height
                )
            }
            await section.screenshot({
                path: testInfo.outputPath('feed-lead-story.png'),
            })

            const href = await card.getAttribute('href')
            expect(href).toMatch(new RegExp(`^/${locale}/(docs|category)/`))
            await card.click({ position: { x: 8, y: 8 } })
            await expect(page).toHaveURL(new URL(href!, page.url()).href)
            await page.goBack()
            await thumbnail.click()
            await expect(page).toHaveURL(new URL(href!, page.url()).href)
            await page.goBack()
            await card.focus()
            await expect(card).toBeFocused()
            await card.press('Enter')
            await expect(page).toHaveURL(new URL(href!, page.url()).href)
        })
    }
}

test('lead card stays inside the viewport at narrow and intermediate widths', async ({
    page,
}) => {
    test.skip(page.viewportSize()?.width !== 1280, 'Run width sweep once.')
    await page.goto('/ko/feed')
    const section = page.getByTestId('feed-lead-story')
    for (const width of [320, 640, 767, 1024]) {
        await page.setViewportSize({ width, height: 844 })
        const card = section.getByRole('link')
        await expect(card).toBeVisible()
        expect(
            await card.evaluate(
                (element) => element.scrollWidth <= element.clientWidth
            )
        ).toBe(true)
        const bounds = (await card.boundingBox())!
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
        expect(
            await section
                .locator('img')
                .evaluate((element) => element.getBoundingClientRect().height)
        ).toBeLessThanOrEqual(192)
    }
    await page.getByRole('link', { name: 'WEB', exact: true }).click()
    await expect(page).toHaveURL(/\/ko\/feed\?topic=web$/)
    await expect(section.getByRole('link')).toBeVisible()
})

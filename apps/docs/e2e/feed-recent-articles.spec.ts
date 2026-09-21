import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: recent articles share compact clickable cards`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/feed`)
            const recent = page.getByTestId('feed-recent-articles')
            await expect(recent.getByRole('heading', { level: 2 })).toHaveText(
                locale === 'ko' ? '최근에 올라온 글' : 'Recent articles'
            )
            const cards = recent.locator('li > a')
            await expect(cards.first()).toBeVisible()
            const count = await cards.count()
            expect(count).toBeLessThanOrEqual(4)
            const leadHref = await page
                .getByTestId('feed-lead-story')
                .getByRole('link')
                .getAttribute('href')
            const hrefs = []
            for (const card of await cards.all()) {
                const title = await card
                    .getByRole('heading', { level: 3 })
                    .innerText()
                await expect(card).toHaveAccessibleName(title)
                await expect(card.locator('a, button')).toHaveCount(0)
                await expect(card.locator('svg')).toHaveCount(0)
                await expect(card.locator('img')).toHaveCount(1)
                const href = await card.getAttribute('href')
                expect(href).not.toBe(leadHref)
                hrefs.push(href)
                expect(
                    await card
                        .locator('img')
                        .evaluate(
                            (element) => element.getBoundingClientRect().height
                        )
                ).toBeLessThanOrEqual(192)
                expect(
                    await card.evaluate(
                        (element) => element.scrollWidth <= element.clientWidth
                    )
                ).toBe(true)
            }
            expect(new Set(hrefs).size).toBe(count)
            await expect(
                recent.getByText(/ROADMAP|CONTRIBUTORS|READ ARTICLE/)
            ).toHaveCount(0)
            const first = cards.first()
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
                path: testInfo.outputPath('recent-card.png'),
            })
            const href = (await first.getAttribute('href'))!
            await first.click({ position: { x: 8, y: 8 } })
            await expect(page).toHaveURL(new URL(href, page.url()).href)
            await page.goBack()
            await first.locator('img').click()
            await expect(page).toHaveURL(new URL(href, page.url()).href)
            await page.goBack()
            await first.focus()
            await first.press('Enter')
            await expect(page).toHaveURL(new URL(href, page.url()).href)
        })
    }
}

test('cards indicate interaction through title color and keyboard focus without arrows', async ({
    page,
}) => {
    test.skip(
        page.viewportSize()?.width !== 1280,
        'Desktop hover and keyboard check.'
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/feed')
    const cards = [
        page.getByTestId('feed-lead-story').getByRole('link'),
        page.getByTestId('feed-recent-articles').locator('li > a').first(),
    ]
    for (const card of cards) {
        await card.scrollIntoViewIfNeeded()
        await page.mouse.move(0, 0)
        const heading = card.getByRole('heading')
        const restingColor = await heading.evaluate(
            (element) => getComputedStyle(element).color
        )
        await card.hover()
        await expect(heading).not.toHaveCSS('color', restingColor)
        await page.mouse.move(0, 0)
        await expect(heading).toHaveCSS('color', restingColor)
        await page.keyboard.press('Tab')
        await card.focus()
        await expect(card).toBeFocused()
        await expect(heading).not.toHaveCSS('color', restingColor)
        expect(
            await card.evaluate((element) => element.matches(':focus-visible'))
        ).toBe(true)
        await expect(card).not.toHaveCSS('box-shadow', 'none')
        await card.press('Tab')
    }
})

test('empty topic keeps filters and returns to actual recent articles', async ({
    page,
}) => {
    await page.goto('/ko/feed?topic=mobile')
    const recent = page.getByTestId('feed-recent-articles')
    await expect(
        recent.getByRole('link', { name: 'MOBILE', exact: true })
    ).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        '아직 이 주제에 올라온 글이 없습니다'
    )
    await expect(recent.locator('li')).toHaveCount(0)
    await expect(
        recent.getByText('이 주제의 다른 글은 아직 없습니다.')
    ).toBeVisible()
    await recent.getByRole('link', { name: 'ALL', exact: true }).click()
    await expect(page).toHaveURL(/\/ko\/feed$/)
    await expect(recent.locator('li > a').first()).toBeVisible()
})

import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: web topics filter in place and survive reload and history`, async ({
            page,
        }, testInfo) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/web`)
            const filters = page.getByTestId('hub-topic-filters')
            const results = page.getByTestId('hub-results')
            await expect(filters).toBeVisible()
            const initialCount = await results.locator(':scope > li').count()
            expect(initialCount).toBeGreaterThan(2)
            await expect(
                page.getByRole('heading', { name: '런타임 감각' })
            ).toHaveCount(0)
            const react = filters.getByRole('link', { name: /^React \d+$/ })
            const reactCount = Number(
                (await react.innerText()).match(/\d+$/)?.[0]
            )
            await expect(react).toHaveAttribute('data-slot', 'button')
            await page.keyboard.press('Tab')
            await react.focus()
            await expect(react).toBeFocused()
            await expect(react).not.toHaveCSS('box-shadow', 'none')
            await page.keyboard.press('Enter')
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/web\\?topic=react$`)
            )
            await expect(react).toHaveAttribute('aria-current', 'true')
            await expect(results.locator(':scope > li')).toHaveCount(reactCount)
            await page.reload()
            await expect(react).toHaveAttribute('aria-current', 'true')
            await expect(results.locator(':scope > li')).toHaveCount(reactCount)
            await page.goBack()
            await expect(page).toHaveURL(new RegExp(`/${locale}/web$`))
            await expect(results.locator(':scope > li')).toHaveCount(
                initialCount
            )
            await page.goForward()
            await expect(react).toHaveAttribute('aria-current', 'true')
            await filters
                .getByRole('link', {
                    name: locale === 'ko' ? /^전체 \d+$/ : /^All \d+$/,
                })
                .click()
            await expect(page).toHaveURL(new RegExp(`/${locale}/web$`))
            await expect(results.locator(':scope > li')).toHaveCount(
                initialCount
            )
            const details = filters.locator('details')
            await details.locator('summary').click()
            const extra = details.getByRole('link').last()
            const extraHref = await extra.getAttribute('href')
            await extra.click()
            await expect(page).toHaveURL(
                new RegExp(`${extraHref?.replace('?', '\\?')}$`)
            )
            const selected = filters.locator('a[aria-current="true"]')
            await expect(selected).toBeVisible()
            await expect(details).not.toHaveAttribute('open', '')
            expect(
                (await selected.boundingBox())!.height
            ).toBeGreaterThanOrEqual(44)
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth
                )
            ).toBe(true)
            await page.screenshot({
                path: testInfo.outputPath('hub-filter.png'),
                fullPage: true,
            })
        })
    }
}

test('unknown topics fall back to all and an empty mobile channel has no placeholder filters', async ({
    page,
}) => {
    await page.goto('/ko/web?topic=not-a-published-topic')
    await expect(
        page
            .getByTestId('hub-topic-filters')
            .getByRole('link', { name: /^전체 \d+$/ })
    ).toHaveAttribute('aria-current', 'true')
    await page.goto('/ko/mobile')
    await expect(
        page.getByRole('heading', { name: '모바일 개발 이야기' })
    ).toBeVisible()
    await expect(page.getByTestId('hub-topic-filters')).toHaveCount(0)
    await expect(
        page.getByRole('heading', { name: '전체 글 0개' })
    ).toBeVisible()
    await expect(
        page.getByRole('heading', { name: '터치 중심 인터페이스' })
    ).toHaveCount(0)
})

test('filters and expanded topics fit a 320px screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/ko/web')
    const filters = page.getByTestId('hub-topic-filters')
    await filters.locator('summary').click()
    for (const link of await filters.getByRole('link').all()) {
        const box = (await link.boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(320)
        expect(box.height).toBeGreaterThanOrEqual(44)
    }
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true)
})

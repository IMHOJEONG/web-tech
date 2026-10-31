import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark']) {
        test(`${locale}/${theme}: journal has readable rows and visible discovery paths`, async ({
            page,
        }) => {
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/feed`)
            const lead = page.getByTestId('feed-lead-story')
            await expect(lead.getByRole('heading', { level: 1 })).toBeVisible()
            await expect(lead.locator('img[src*="default"]')).toHaveCount(0)
            const backend = page
                .getByRole('complementary', {
                    name:
                        locale === 'ko' ? '주제로 찾아보기' : 'Browse by topic',
                })
                .getByRole('link', { name: /Backend/ })
            await expect(backend).toHaveAttribute(
                'href',
                `/${locale}/docs?section=backend`
            )
            await backend.click()
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?section=backend$`)
            )
            const results = page.getByTestId('docs-index-results')
            await expect(results.locator('article').first()).toBeVisible()
            await expect(results.getByText(/^(OPEN|열기)$/)).toHaveCount(0)
            expect(
                await page.evaluate(
                    () => document.documentElement.scrollWidth - innerWidth
                )
            ).toBe(0)
        })
    }
}

test('mobile table of contents opens and reaches an unobscured heading', async ({
    page,
}) => {
    test.skip(page.viewportSize()!.width >= 1024, 'Mobile and tablet TOC.')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/docs/web/javascript-event-loop-runtime')
    const toc = page.getByTestId('article-mobile-toc')
    const summary = toc.locator('summary')
    await expect(summary).toBeVisible()
    await expect(toc.locator('details')).not.toHaveAttribute('open')
    await summary.focus()
    await summary.press('Enter')
    const link = toc.getByRole('link', { name: /실무 체크리스트/ })
    await expect(link).toBeVisible()
    const href = (await link.getAttribute('href'))!
    await link.click()
    await expect(toc.locator('details')).not.toHaveAttribute('open')
    await expect
        .poll(() => decodeURIComponent(new URL(page.url()).hash))
        .toBe(decodeURIComponent(href))
    await expect
        .poll(() =>
            page.evaluate(
                (hash) =>
                    document
                        .getElementById(decodeURIComponent(hash.slice(1)))!
                        .getBoundingClientRect().top,
                href
            )
        )
        .toBeLessThan(page.viewportSize()!.height * 0.75)
    const offset = await page.evaluate((hash) => {
        const target = document.getElementById(
            decodeURIComponent(hash.slice(1))
        )!
        return (
            target.getBoundingClientRect().top -
            document.querySelector('header')!.getBoundingClientRect().bottom
        )
    }, href)
    expect(offset).toBeGreaterThanOrEqual(8)
})

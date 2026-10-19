import { expect, test } from '@playwright/test'
import {
    openDocsIndexFilters,
    visibleDocsIndexFilters,
} from './helpers/docs-index'

for (const locale of ['ko', 'en']) {
    for (const query of ['', '?q=stream']) {
        test(`${locale}${query}: results precede secondary navigation and fit the initial view`, async ({
            page,
        }, testInfo) => {
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/docs${query}`)
            const results = page.getByTestId('docs-index-results')
            const title = results.locator('article h3').first()
            await expect(title).toBeVisible()
            await expect(visibleDocsIndexFilters(page)).not.toHaveAttribute(
                'open'
            )
            const layout = await title.evaluate((element) => ({
                firstTitleTop: Math.round(
                    element.getBoundingClientRect().top + scrollY
                ),
                width: innerWidth,
                height: innerHeight,
                pageWidth: document.documentElement.scrollWidth,
                secondaryTop: Math.round(
                    document
                        .querySelector('[data-testid="docs-index-secondary"]')!
                        .getBoundingClientRect().top + scrollY
                ),
                resultsBottom: Math.round(
                    document
                        .querySelector('[data-testid="docs-index-results"]')!
                        .getBoundingClientRect().bottom + scrollY
                ),
            }))
            const maximum = layout.width < 640 ? (query ? 500 : 650) : 550
            expect(layout.firstTitleTop).toBeLessThanOrEqual(maximum)
            expect(layout.pageWidth).toBeLessThanOrEqual(layout.width)
            expect(layout.secondaryTop).toBeGreaterThanOrEqual(
                layout.resultsBottom
            )
            await testInfo.attach('docs-index-layout', {
                body: JSON.stringify(layout, null, 2),
                contentType: 'application/json',
            })
            await page.screenshot({
                path: testInfo.outputPath('initial-view.png'),
                caret: 'initial',
            })
        })
    }

    test(`${locale}: collapsed filters keep selections visible and independently clearable`, async ({
        page,
    }) => {
        await page.goto(
            `/${locale}/docs?section=web&sort=title&tag=react&collection=react-boundaries`
        )
        const active = page.locator(
            '[data-testid="docs-index-active-filters"]:visible'
        )
        await expect(active.getByRole('link')).toHaveCount(4)
        await expect(visibleDocsIndexFilters(page)).not.toHaveAttribute('open')
        await page.reload()
        await expect(active.getByRole('link')).toHaveCount(4)
        await active.getByRole('link', { name: /#react/ }).click()
        await expect
            .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
            .toEqual({
                section: 'web',
                sort: 'title',
                collection: 'react-boundaries',
            })
        await active.getByRole('link', { name: /React.*Next.js/ }).click()
        await expect
            .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
            .toEqual({ section: 'web', sort: 'title' })
        await openDocsIndexFilters(page)
        await visibleDocsIndexFilters(page)
            .locator('a[href*="sort=section"]')
            .click()
        await expect
            .poll(() => new URL(page.url()).searchParams.get('sort'))
            .toBe('section')
        const summary = visibleDocsIndexFilters(page).locator('summary')
        await summary.focus()
        await page.keyboard.press('Enter')
        await expect(visibleDocsIndexFilters(page)).not.toHaveAttribute('open')
        await expect(active.getByRole('link')).toHaveCount(2)
    })
}

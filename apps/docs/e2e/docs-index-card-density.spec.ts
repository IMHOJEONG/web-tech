import { expect, test } from '@playwright/test'
import { readyDocsIndex } from './helpers/docs-index'

for (const locale of ['ko', 'en']) {
    for (const theme of ['light', 'dark'] as const) {
        test(`${locale} ${theme}: compact cards preserve metadata, highlights and whole-card navigation`, async ({
            page,
        }) => {
            await page.emulateMedia({
                colorScheme: theme,
                reducedMotion: 'reduce',
            })
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.goto(`/${locale}/docs?q=react`)
            const cards = readyDocsIndex(page).locator('[data-docs-index-card]')
            const card = cards.filter({
                has: page.getByRole('heading', {
                    name: /Server Component와 Client Component/,
                }),
            })
            await expect(card).toHaveCount(1)
            await expect(card.locator('h3 .search-highlight')).toHaveCount(0)
            await expect(
                card.locator('p .search-highlight').first()
            ).toBeVisible()
            const labels = await card.locator('li').allTextContents()
            expect(labels[0]).toBe(locale === 'ko' ? '3분 읽기' : '3 min read')
            const normalized = labels.slice(1).map((label) =>
                label
                    .replace(/^\s*·\s*/, '')
                    .replace(/^#/, '')
                    .trim()
                    .toLowerCase()
            )
            expect(
                normalized.filter((label) => label === 'react')
            ).toHaveLength(1)
            expect(new Set(normalized).size).toBe(normalized.length)
            await expect(card.locator('a, button')).toHaveCount(0)
            const spacing = await card.evaluate((el) => {
                const style = getComputedStyle(el)
                const root = parseFloat(
                    getComputedStyle(document.documentElement).fontSize
                )
                return {
                    top: parseFloat(style.paddingTop),
                    bottom: parseFloat(style.paddingBottom),
                    expected: root * (innerWidth < 640 ? 1 : 1.25),
                    titleFont: parseFloat(
                        getComputedStyle(el.querySelector('h3')!).fontSize
                    ),
                    expectedTitleFont: root * (innerWidth < 768 ? 1 : 1.125),
                }
            })
            expect(spacing.top).toBe(spacing.expected)
            expect(spacing.bottom).toBe(spacing.expected)
            expect(spacing.titleFont).toBe(spacing.expectedTitleFont)
            await page.goto(`/${locale}/docs?q=component`)
            await expect(
                card.locator('h3 .search-highlight').first()
            ).toBeVisible()
            await page.keyboard.press('Tab')
            await card.focus()
            await expect(card).toBeFocused()
            await expect
                .poll(() =>
                    card.evaluate((el) => getComputedStyle(el).boxShadow)
                )
                .not.toBe('none')
            const href = await card.getAttribute('href')
            expect(href).toBeTruthy()
            const destination = new URL(href!, page.url()).toString()
            await card.press('Enter')
            await expect(page).toHaveURL(destination)
            await expect(page.locator('[data-page-pending]')).toHaveCount(0)
            await expect(page.locator('main h1')).toBeVisible()
            await page.goBack()
            await expect(card).toBeVisible()
            // The empty padding is part of the same link, not a separate CTA.
            await card.click({ position: { x: 8, y: 8 } })
            await expect(page).toHaveURL(destination)
            await expect(page.locator('[data-page-pending]')).toHaveCount(0)
        })

        test(`${locale} ${theme}: narrow large text keeps titles, summaries and touch targets readable`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 320, height: 844 })
            await page.emulateMedia({
                colorScheme: theme,
                reducedMotion: 'reduce',
            })
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            await page.goto(`/${locale}/docs?q=react`)
            const cards = readyDocsIndex(page).locator('[data-docs-index-card]')
            await expect(cards.first()).toBeVisible()
            await page.evaluate(async () => {
                document.documentElement.style.fontSize = '24px'
                await document.fonts.ready
            })
            const metrics = await cards.evaluateAll((elements) =>
                elements.map((el) => {
                    const title = el.querySelector('h3')!
                    const summary = el.querySelector('p')!
                    const style = getComputedStyle(el)
                    const heading = getComputedStyle(title)
                    const excerpt = getComputedStyle(summary)
                    return {
                        height: el.getBoundingClientRect().height,
                        paddingTop: parseFloat(style.paddingTop),
                        paddingBottom: parseFloat(style.paddingBottom),
                        titleFont: parseFloat(heading.fontSize),
                        titleOverflow: title.scrollWidth - title.clientWidth,
                        titleClamped: heading.webkitLineClamp,
                        summaryFont: parseFloat(excerpt.fontSize),
                        summaryClamp: excerpt.webkitLineClamp,
                        summaryHeight: summary.getBoundingClientRect().height,
                        summaryLineHeight: parseFloat(excerpt.lineHeight),
                        pageOverflow:
                            document.documentElement.scrollWidth - innerWidth,
                    }
                })
            )
            expect(metrics.length).toBeGreaterThan(0)
            for (const metric of metrics) {
                expect(metric.height).toBeGreaterThanOrEqual(44)
                expect(metric.paddingTop).toBe(24)
                expect(metric.paddingBottom).toBe(24)
                expect(metric.titleFont).toBe(24)
                expect(metric.titleOverflow).toBeLessThanOrEqual(1)
                expect(metric.titleClamped).toBe('none')
                expect(metric.summaryFont).toBe(21)
                expect(metric.summaryClamp).toBe('2')
                expect(metric.summaryHeight).toBeLessThanOrEqual(
                    metric.summaryLineHeight * 2 + 1
                )
                expect(metric.pageOverflow).toBeLessThanOrEqual(1)
            }
        })
    }
}

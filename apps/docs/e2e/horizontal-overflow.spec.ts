import { expect, test, type Page } from '@playwright/test'

const routes = [
    { name: 'docs index', path: '/docs' },
    { name: 'docs search', path: '/docs?q=Accessibility' },
    {
        name: 'docs long search',
        path: `/docs?q=${encodeURIComponent(
            'AccessibilityAccessibilityAccessibilityAccessibility'
        )}`,
    },
    {
        name: 'docs filtered index',
        path: '/docs?section=web&source=all&sort=latest',
    },
    { name: 'feed', path: '/feed' },
    { name: 'web hub', path: '/web' },
    { name: 'about', path: '/about' },
] as const

async function getHorizontalOverflowReport(page: Page) {
    return page.evaluate(() => {
        const viewportWidth = window.innerWidth
        const documentScrollWidth = document.documentElement.scrollWidth
        const bodyScrollWidth = document.body?.scrollWidth ?? 0

        const overflowingElements = Array.from(
            document.querySelectorAll<HTMLElement>('body *')
        )
            .map((element) => {
                const rect = element.getBoundingClientRect()
                const overflowRight = rect.right - viewportWidth

                return {
                    tagName: element.tagName.toLowerCase(),
                    className:
                        typeof element.className === 'string'
                            ? element.className
                            : '',
                    text: element.textContent?.trim().slice(0, 80) ?? '',
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    overflowRight: Math.round(overflowRight),
                }
            })
            .filter((element) => {
                return element.overflowRight > 1 || element.left < -1
            })
            .slice(0, 8)

        return {
            viewportWidth,
            documentScrollWidth,
            bodyScrollWidth,
            overflowingElements,
        }
    })
}

test.describe('docs responsive horizontal overflow', () => {
    for (const route of routes) {
        test(`${route.name} stays within the viewport`, async ({ page }) => {
            await page.goto(route.path)
            await page.waitForLoadState('domcontentloaded')

            const report = await getHorizontalOverflowReport(page)

            expect(
                report.documentScrollWidth,
                JSON.stringify(report, null, 2)
            ).toBeLessThanOrEqual(report.viewportWidth + 1)
            expect(
                report.bodyScrollWidth,
                JSON.stringify(report, null, 2)
            ).toBeLessThanOrEqual(report.viewportWidth + 1)
        })
    }
})

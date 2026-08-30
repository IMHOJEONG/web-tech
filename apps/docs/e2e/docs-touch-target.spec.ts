import { expect, test, type Page } from '@playwright/test'

const minimumTouchTargetSize = 44

async function getSmallTouchTargets(page: Page) {
    return page.evaluate((minimumSize) => {
        return Array.from(
            document.querySelectorAll<HTMLElement>(
                '[data-touch-target="docs-index"]'
            )
        )
            .filter((element) => {
                const style = window.getComputedStyle(element)
                const rect = element.getBoundingClientRect()

                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0
                )
            })
            .map((element) => {
                const rect = element.getBoundingClientRect()

                return {
                    tagName: element.tagName.toLowerCase(),
                    text: element.textContent?.trim().slice(0, 80) ?? '',
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                }
            })
            .filter((element) => {
                return (
                    element.width < minimumSize || element.height < minimumSize
                )
            })
    }, minimumTouchTargetSize)
}

test.describe('docs mobile touch targets', () => {
    test('docs index keeps primary touch targets large enough', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 390,
            'This assertion is scoped to the mobile project.'
        )

        await page.goto('/docs')

        const smallTargets = await getSmallTouchTargets(page)

        expect(smallTargets, JSON.stringify(smallTargets, null, 2)).toEqual([])
    })

    test('docs search keeps primary touch targets large enough', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 390,
            'This assertion is scoped to the mobile project.'
        )

        await page.goto('/docs?q=Accessibility')

        const smallTargets = await getSmallTouchTargets(page)

        expect(smallTargets, JSON.stringify(smallTargets, null, 2)).toEqual([])
    })
})

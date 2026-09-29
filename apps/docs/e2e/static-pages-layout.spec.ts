import { expect, test } from '@playwright/test'

for (const route of ['privacy', 'terms', 'changelog']) {
    test(`${route}: utility content stays compact without horizontal overflow`, async ({
        page,
    }) => {
        await page.goto(`/ko/${route}`)

        const main = page.getByRole('main')
        const heading = main.getByRole('heading', { level: 1 })
        await expect(heading).toBeVisible()
        await expect(main.locator('article')).toHaveCount(3)
        await expect(main.locator('aside')).toHaveCount(0)

        const headingTop = await heading.evaluate(
            (element) => element.getBoundingClientRect().top
        )
        expect(headingTop).toBeLessThan(220)
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            )
        ).toBe(true)

        if (page.viewportSize()?.width === 1280) {
            const links = page
                .getByTestId('footer-utility-links')
                .getByRole('link')
            await expect(links).toHaveCount(4)
            const boxes = await links.evaluateAll((elements) =>
                elements.map((element) => {
                    const rect = element.getBoundingClientRect()
                    return {
                        left: rect.left,
                        right: rect.right,
                        height: rect.height,
                    }
                })
            )
            expect(boxes.every((box) => box.height >= 44)).toBe(true)
            expect(
                boxes.slice(1).every((box, index) => {
                    const previous = boxes[index]
                    return (
                        previous !== undefined &&
                        box.left - previous.right <= 12
                    )
                })
            ).toBe(true)
        }
    })
}

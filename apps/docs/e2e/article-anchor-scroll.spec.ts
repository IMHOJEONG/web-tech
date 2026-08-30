import { expect, test } from '@playwright/test'

type HeadingPosition = {
    headerBottom: number
    headingTop: number
    viewportHeight: number
}

test.describe('docs article anchor navigation', () => {
    test('desktop toc keeps the target heading below the sticky header', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 1280,
            'This assertion is scoped to the desktop project.'
        )

        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto('/docs/web/javascript-event-loop-runtime')

        const tocLink = page
            .locator('aside')
            .getByRole('link', { name: /실무 체크리스트/ })
            .first()

        await expect(tocLink).toBeVisible()

        const href = await tocLink.getAttribute('href')

        expect(href).toMatch(/^#.+/)

        const targetId = decodeURIComponent(href!.slice(1))

        await tocLink.click()

        const headingPosition = await page.waitForFunction((id) => {
            const heading = document.getElementById(id)
            const header = document.querySelector('header')

            if (!heading || !header) {
                return null
            }

            const headingRect = heading.getBoundingClientRect()
            const headerRect = header.getBoundingClientRect()

            return {
                headerBottom: Math.round(headerRect.bottom),
                headingTop: Math.round(headingRect.top),
                viewportHeight: window.innerHeight,
            }
        }, targetId)

        const position = await headingPosition.jsonValue()

        expect(position).not.toBeNull()

        const { headerBottom, headingTop, viewportHeight } =
            position as HeadingPosition

        expect(headingTop).toBeGreaterThanOrEqual(headerBottom + 8)
        expect(headingTop).toBeLessThan(viewportHeight * 0.75)
    })
})

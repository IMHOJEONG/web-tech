import { expect, test } from '@playwright/test'

type HeadingPosition = {
    headerTop: number
    headerHeight: number
    headerBottom: number
    headingTop: number
    viewportHeight: number
}

test.describe('docs article anchor navigation', () => {
    test('Brotli numbered part links reach the matching headings on every viewport', async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        // This header has no behavior unless the separate test server loads its probe.
        await page.setExtraHTTPHeaders({
            'x-article-heading-fixture': 'synthetic-headings',
        })
        await page.goto(
            '/ko/docs/category/be/node-js/node-brotli-runtime-security'
        )
        await expect(
            page.getByRole('heading', {
                name: 'Authored introduction',
                exact: true,
            })
        ).toHaveCount(0)
        const mobile = (page.viewportSize()?.width ?? 0) < 1024
        const toc = mobile
            ? page.getByTestId('article-mobile-toc').locator('details')
            : page.locator('aside details').first()

        for (const title of [
            '1/2 — 압축할 바이트 만들기',
            '2/2 — 복원 결과와 실행 버전 출력',
        ]) {
            const heading = page.getByRole('heading', {
                name: title,
                exact: true,
            })
            await expect(heading).toBeVisible()
            if (mobile) await toc.locator('summary').click()
            const link = toc.getByRole('link', { name: title, exact: true })
            const href = await link.getAttribute('href')
            const id = decodeURIComponent(href!.slice(1))
            await expect(heading).toHaveAttribute('id', id)
            await link.click()
            await expect
                .poll(() =>
                    heading.evaluate((element) => {
                        const top = element.getBoundingClientRect().top
                        const bottom = document
                            .querySelector('header')!
                            .getBoundingClientRect().bottom
                        return top >= bottom + 8 && top < innerHeight * 0.75
                    })
                )
                .toBe(true)
            expect(decodeURIComponent(new URL(page.url()).hash.slice(1))).toBe(
                id
            )
            if (mobile) {
                await expect(toc).not.toHaveAttribute('open')
                await expect(heading).toBeFocused()
            }
        }
    })

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
                headerTop: Math.round(headerRect.top),
                headerHeight: Math.round(headerRect.height),
                headerBottom: Math.round(headerRect.bottom),
                headingTop: Math.round(headingRect.top),
                viewportHeight: window.innerHeight,
            }
        }, targetId)

        const position = await headingPosition.jsonValue()

        expect(position).not.toBeNull()

        const {
            headerTop,
            headerHeight,
            headerBottom,
            headingTop,
            viewportHeight,
        } = position as HeadingPosition

        expect(headerTop).toBe(0)
        expect(headerHeight).toBe(65)
        expect(headingTop).toBeGreaterThanOrEqual(headerBottom + 8)
        expect(headingTop).toBeLessThan(viewportHeight * 0.75)
    })
})

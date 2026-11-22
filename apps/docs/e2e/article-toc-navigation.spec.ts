import { expect, test } from '@playwright/test'

for (const rootFontSize of [16, 24]) {
    test(`TOC rows keep text centered and same-depth labels aligned at ${rootFontSize}px`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto(
            '/ko/docs/category/be/node-js/node-brotli-runtime-security'
        )
        await page.addStyleTag({
            content: `html { font-size: ${rootFontSize}px; }`,
        })
        await page.evaluate(() => document.fonts.ready)
        const mobile = (page.viewportSize()?.width ?? 0) < 1024
        const panel = mobile
            ? page.getByTestId('article-mobile-toc').locator('details')
            : page.locator('aside details').first()
        if ((await panel.getAttribute('open')) === null)
            await panel.locator('summary').click()
        const links = panel.locator('nav a[data-toc-depth]')
        await expect(links).toHaveCount(4)
        await expect(links.first()).toBeVisible()

        const rows = await links.evaluateAll((elements) =>
            elements.map((element) => {
                const label = element.querySelector('span:last-child')!
                const row = element.getBoundingClientRect()
                const text = label.getBoundingClientRect()
                return {
                    depth: element.getAttribute('data-toc-depth'),
                    left: text.left,
                    height: row.height,
                    centerOffset:
                        text.top + text.height / 2 - (row.top + row.height / 2),
                }
            })
        )
        for (const row of rows) {
            expect(Math.abs(row.centerOffset)).toBeLessThanOrEqual(1)
            expect(row.height).toBeGreaterThanOrEqual(
                (mobile ? 44 : 36) * (rootFontSize / 16)
            )
            const sameDepth = rows.filter((other) => other.depth === row.depth)
            expect(
                Math.max(...sameDepth.map((item) => item.left)) -
                    Math.min(...sameDepth.map((item) => item.left))
            ).toBeLessThanOrEqual(1)
        }
        expect(rows.find((row) => row.depth === '3')!.left).toBeGreaterThan(
            rows.find((row) => row.depth === '2')!.left
        )
        expect(
            await panel.evaluate(
                (element) => element.scrollWidth - element.clientWidth
            )
        ).toBeLessThanOrEqual(1)
    })
}

for (const theme of ['light', 'dark']) {
    test(`${theme}: TOC highlights the reading position and preserves anchors`, async ({
        page,
    }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto('/ko/docs/web/javascript-event-loop-runtime')
        const mobile = (page.viewportSize()?.width ?? 0) < 1024
        const panel = mobile
            ? page.getByTestId('article-mobile-toc').locator('details')
            : page.locator('aside details').first()
        if (mobile) {
            await expect(panel).not.toHaveAttribute('open')
            await panel.locator('summary').click()
        }
        const nav = panel.locator('nav[aria-label="이 글의 목차"]')
        await expect(nav).toBeVisible()
        await expect(nav.locator('a[aria-current="location"]')).toHaveCount(1)
        const targetLink = nav.getByRole('link', {
            name: /실무 체크리스트/,
            includeHidden: true,
        })
        const href = (await targetLink.getAttribute('href'))!
        await targetLink.click()
        await expect
            .poll(() => decodeURIComponent(new URL(page.url()).hash))
            .toBe(decodeURIComponent(href))
        await expect(targetLink).toHaveAttribute('aria-current', 'location')
        if (mobile) {
            await expect(panel).not.toHaveAttribute('open')
            const heading = page.locator(
                `[id="${decodeURIComponent(href.slice(1))}"]`
            )
            await expect(heading).toBeFocused()
        }
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth
            )
        ).toBeLessThanOrEqual(1)
    })
}

test('manual scrolling updates TOC without modifying the URL hash', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/docs/web/javascript-event-loop-runtime')
    const panel =
        (page.viewportSize()?.width ?? 0) < 1024
            ? page.getByTestId('article-mobile-toc').locator('details')
            : page.locator('aside details').first()
    const link = panel.getByRole('link', {
        name: /실무 체크리스트/,
        includeHidden: true,
    })
    const href = (await link.getAttribute('href'))!
    await expect(panel.locator('a[aria-current="location"]')).toHaveCount(1)
    await page.evaluate((hash) => {
        document
            .getElementById(decodeURIComponent(hash.slice(1)))!
            .scrollIntoView({ block: 'start' })
    }, href)
    await expect(link).toHaveAttribute('aria-current', 'location')
    expect(new URL(page.url()).hash).toBe('')
})

test('mobile Escape closes the TOC and returns focus to its summary', async ({
    page,
}) => {
    test.skip(
        (page.viewportSize()?.width ?? 0) >= 1024,
        'Mobile and tablet TOC.'
    )
    await page.goto('/ko/docs/web/javascript-event-loop-runtime')
    const panel = page.getByTestId('article-mobile-toc').locator('details')
    const summary = panel.locator('summary')
    await summary.focus()
    await summary.press('Enter')
    const link = panel.getByRole('link').first()
    await link.focus()
    await link.press('Escape')
    await expect(panel).not.toHaveAttribute('open')
    await expect(summary).toBeFocused()
})

test('TOC remains readable with large text and reduced motion', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/docs/category/be/node-js/node-brotli-runtime-security')
    await page.addStyleTag({ content: 'html { font-size: 24px; }' })
    const panel =
        (page.viewportSize()?.width ?? 0) < 1024
            ? page.getByTestId('article-mobile-toc').locator('details')
            : page.locator('aside details').first()
    if ((await panel.getAttribute('open')) === null)
        await panel.locator('summary').click()
    await expect(panel.getByRole('link').first()).toBeVisible()
    expect(
        await panel.evaluate(
            (element) => element.scrollWidth - element.clientWidth
        )
    ).toBeLessThanOrEqual(1)
    const link = panel.getByRole('link').first()
    await expect(link).toHaveCSS('transition-duration', '0s')
})

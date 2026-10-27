import { expect, test } from '@playwright/test'
import {
    createFrozenSkeletonPage,
    readSkeletonGeometry,
} from './helpers/frozen-skeleton'

test('frozen skeleton survives live page replacement without disabling real CSS checks', async ({
    browser,
    page,
}, testInfo) => {
    const path = '/ko/feed'
    const response = await page.request.get(path)
    expect(response.ok()).toBe(true)
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
    await page.addInitScript(() => localStorage.setItem('theme', 'light'))
    await page.goto(path)
    await expect(page.locator('[data-page-pending]')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    await page.evaluate(() => document.fonts.ready)
    const frozen = await createFrozenSkeletonPage({
        browser,
        page,
        serverHtml: await response.text(),
        kind: 'feed',
        theme: 'light',
        isMobile: testInfo.project.use.isMobile,
        hasTouch: testInfo.project.use.hasTouch,
    })
    try {
        expect(frozen.context()).not.toBe(page.context())
        expect(frozen.url()).toBe(page.url())
        await expect(frozen.locator('script')).toHaveCount(0)
        const pending = frozen.locator('[data-page-pending="feed"]')
        const before = await pending.evaluate(readSkeletonGeometry)
        expect(before.width).toBeGreaterThan(0)
        expect(before.animations).toBe(0)

        await page.reload()
        await expect(page.locator('[data-page-pending]')).toHaveCount(0)
        expect(await pending.evaluate(readSkeletonGeometry)).toEqual(before)

        await frozen.emulateMedia({ reducedMotion: 'no-preference' })
        await expect
            .poll(
                async () =>
                    (await pending.evaluate(readSkeletonGeometry)).animations
            )
            .toBeGreaterThan(0)
        await frozen.emulateMedia({ reducedMotion: 'reduce' })
        expect((await pending.evaluate(readSkeletonGeometry)).animations).toBe(
            0
        )

        await pending.evaluate((el) =>
            el.setAttribute('style', 'margin-left: 12px')
        )
        const shifted = await pending.evaluate(readSkeletonGeometry)
        expect(Math.abs(shifted.left - before.left)).toBeGreaterThan(1)
    } finally {
        await frozen.context().close()
    }
})

test('geometry rejects detached nodes instead of reporting empty computed styles as animations', async ({
    page,
}) => {
    await page.setContent('<main><span>first</span><span>second</span></main>')
    const main = await page.locator('main').elementHandle()
    if (!main) throw new Error('Missing diagnostic element')
    expect((await main.evaluate(readSkeletonGeometry)).animations).toBe(0)
    const detachedStyles = await main.evaluate((el) => {
        el.remove()
        return Array.from(
            el.children,
            (node) => getComputedStyle(node).animationName
        )
    })
    expect(detachedStyles).toEqual(['', ''])
    await expect(main.evaluate(readSkeletonGeometry)).rejects.toThrow(
        'Cannot measure a detached skeleton element'
    )
})

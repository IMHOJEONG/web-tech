import { expect, test } from './helpers/skeleton-diagnostic'
import { openSkeletonSnapshot } from './helpers/skeleton-snapshot'

test('server skeleton snapshot survives source updates without running app scripts', async ({
    page,
}) => {
    const errors: string[] = []
    const html = await (await page.request.get('/ko/feed')).text()
    await page.goto('/ko/feed')
    await expect(page.locator('[data-page-pending]')).toHaveCount(0)
    await expect(page.getByTestId('feed-lead-story')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const sourceMain = await page.locator('main').evaluateHandle((el) => el)
    const frozen = await openSkeletonSnapshot(page, html, 'feed', 'light')
    frozen.on('pageerror', (error) => errors.push(error.message))
    const pending = frozen.locator('[data-page-pending="feed"]')
    try {
        await expect(pending).toBeVisible()
        await expect(pending).toHaveAttribute('aria-busy', 'true')
        await expect(pending.locator(':scope > [role="status"]')).toHaveCount(1)
        expect(
            await sourceMain.evaluate(
                (el) => el.isConnected && el === document.querySelector('main')
            )
        ).toBe(true)
        await expect(page.locator('[data-page-pending]')).toHaveCount(0)
        await expect(frozen.locator('script')).toHaveCount(0)
        await expect(frozen.locator('link[rel="stylesheet"]')).toHaveCount(0)
        await expect(
            frozen.locator('style[data-skeleton-snapshot="loaded-css"]')
        ).toHaveCount(1)
        expect(
            await frozen.evaluate(
                () =>
                    performance
                        .getEntriesByType('resource')
                        .filter(
                            (entry) =>
                                (entry as PerformanceResourceTiming)
                                    .initiatorType === 'script'
                        ).length
            )
        ).toBe(0)

        // Exercise a late source update and prove that even a script injected into
        // the copied document cannot erase the geometry under inspection.
        await page.evaluate(() => {
            document.querySelector('main')!.dataset.snapshotSourceUpdated =
                'true'
        })
        await expect(page.locator('main')).toHaveAttribute(
            'data-snapshot-source-updated',
            'true'
        )
        await frozen.evaluate(() => {
            const script = document.createElement('script')
            script.textContent =
                'document.querySelector("[data-page-pending]").remove()'
            document.body.append(script)
        })
        await expect(pending).toBeVisible()
        await expect(pending).toHaveAttribute('aria-busy', 'true')
        await expect(
            pending.locator(':scope > [role="status"]')
        ).not.toHaveText('')
        expect(errors).toEqual([])
    } finally {
        await sourceMain.dispose()
        await frozen.close()
    }
})

test('missing server skeleton is a hard failure and leaves the source intact', async ({
    page,
}) => {
    await page.goto('/ko/feed')
    await expect(page.locator('[data-page-pending]')).toHaveCount(0)
    const count = page.context().pages().length
    await expect(
        openSkeletonSnapshot(
            page,
            '<!doctype html><html><body></body></html>',
            'feed',
            'light'
        )
    ).rejects.toThrow('Missing server skeleton: feed')
    expect(page.context().pages()).toHaveLength(count)
    await expect(page.getByTestId('feed-lead-story')).toBeVisible()
})

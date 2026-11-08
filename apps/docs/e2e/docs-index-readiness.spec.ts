import { expect, test } from '@playwright/test'
import {
    openDocsIndexFilters,
    readyDocsIndex,
    visibleDocsIndexFilters,
} from './helpers/docs-index'
import { holdDocsIndexCompletion } from './helpers/streamed-docs-index'

for (const locale of ['ko', 'en']) {
    test(`${locale}: streamed fallback cannot satisfy filter readiness`, async ({
        page,
        baseURL,
    }, testInfo) => {
        const pageErrors: string[] = []
        page.on('pageerror', (error) => pageErrors.push(error.message))
        const target = new URL(
            `/${locale}/docs?section=web&sort=title`,
            baseURL
        ).href
        const stream = await holdDocsIndexCompletion(page, target)
        try {
            await page.goto(target, { waitUntil: 'commit' })
            const pending = page.getByTestId('content-pending')
            const fallback = pending.getByTestId('docs-index-filters')
            await expect(fallback).toBeVisible()
            await expect(
                pending
                    .getByTestId('docs-index-active-filters')
                    .getByRole('link')
            ).toHaveCount(2)
            await expect(visibleDocsIndexFilters(page)).toHaveCount(0)

            // Native details work before hydration, but this is not the final DOM.
            const pendingSummary = fallback.locator('summary')
            await pendingSummary.focus()
            await expect(pendingSummary).toBeFocused()
            await page.keyboard.press('Enter')
            await expect(fallback).toHaveAttribute('open')
            const fallbackNode = await fallback.elementHandle()
            stream.release()
            await openDocsIndexFilters(page)
            await expect(pending).toHaveCount(0)
            expect(
                await fallbackNode!.evaluate((node) => node.isConnected)
            ).toBe(false)

            await visibleDocsIndexFilters(page)
                .locator('a[href*="sort=section"]')
                .click()
            await expect
                .poll(() =>
                    Object.fromEntries(new URL(page.url()).searchParams)
                )
                .toEqual({ section: 'web', sort: 'section' })
            await expect(
                readyDocsIndex(page)
                    .getByTestId('docs-index-active-filters')
                    .getByRole('link')
            ).toHaveText(['Web', locale === 'ko' ? '섹션순' : 'Section'])
            const summary = visibleDocsIndexFilters(page).locator('summary')
            await openDocsIndexFilters(page)
            await summary.focus()
            await expect(summary).toBeFocused()
            await page.keyboard.press('Enter')
            await expect(visibleDocsIndexFilters(page)).not.toHaveAttribute(
                'open'
            )
            expect(pageErrors).toEqual([])
            await testInfo.attach('filter-readiness', {
                body: JSON.stringify({
                    locale,
                    fallbackRejected: true,
                    fallbackDetached: true,
                    sort: 'section',
                    keyboardClosed: true,
                }),
                contentType: 'application/json',
            })
        } finally {
            await stream.dispose()
        }
    })
}

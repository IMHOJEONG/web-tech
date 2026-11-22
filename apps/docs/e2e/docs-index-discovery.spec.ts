import { expect, test } from '@playwright/test'
import {
    docsIndexDiscovery,
    docsIndexDiscoverySummary,
    readyDocsIndex,
} from './helpers/docs-index'

for (const locale of ['ko', 'en']) {
    test(`${locale}: secondary discovery starts compact and supports native keyboard toggling`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/docs`)
        const discovery = docsIndexDiscovery(page)
        await expect(discovery).not.toHaveAttribute('open')
        await expect(
            discovery.getByTestId('content-tag-filters')
        ).not.toBeVisible()
        const box = await discovery.boundingBox()
        expect(box!.height).toBeLessThanOrEqual(128)
        const summary = docsIndexDiscoverySummary(page)
        await expect(summary).toHaveCount(1)
        expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44)
        await summary.focus()
        await summary.press('Enter')
        await expect(discovery).toHaveAttribute('open')
        await expect(summary).toBeFocused()
        await expect(discovery.getByTestId('content-tag-filters')).toBeVisible()
        const stats = discovery.getByTestId('docs-index-stats')
        await expect(stats.locator('dt')).toHaveText(
            locale === 'ko'
                ? ['분류', '최근 수정']
                : ['Sections', 'Latest Update']
        )
        await expect(
            discovery.getByRole('link', { name: /^Web / })
        ).toHaveAttribute('href', `/${locale}/web`)
        await summary.press('Space')
        await expect(discovery).not.toHaveAttribute('open')
        await expect(summary).toBeFocused()
        await expect(
            discovery.getByTestId('content-tag-filters')
        ).not.toBeVisible()
        await page.reload()
        await expect(discovery).not.toHaveAttribute('open')
    })

    test(`${locale}: selected discovery stays open and clearing preserves the other search conditions`, async ({
        page,
    }) => {
        await page.goto(
            `/${locale}/docs?q=react&section=web&tag=react&collection=react-boundaries`
        )
        const discovery = docsIndexDiscovery(page)
        await expect(discovery).toHaveAttribute('open')
        const active = readyDocsIndex(page).getByTestId(
            'docs-index-active-filters'
        )
        await expect(active.getByRole('link')).toHaveCount(3)
        await page.reload()
        await expect(discovery).toHaveAttribute('open')
        await active.getByRole('link', { name: /#react/ }).click()
        await expect
            .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
            .toEqual({
                q: 'react',
                section: 'web',
                collection: 'react-boundaries',
            })
        await expect(discovery).toHaveAttribute('open')
        await expect(active.getByRole('link')).toHaveCount(2)
        const summary = docsIndexDiscoverySummary(page)
        await summary.click()
        await expect(discovery).not.toHaveAttribute('open')
        await expect(
            active.getByRole('link', { name: /React.*Next.js/ })
        ).toBeVisible()
        await active.getByRole('link', { name: /React.*Next.js/ }).click()
        await expect
            .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
            .toEqual({ q: 'react', section: 'web' })
        await expect(discovery).not.toHaveAttribute('open')
        await expect(active.getByRole('link')).toHaveCount(1)
    })
}

for (const theme of ['light', 'dark']) {
    test(`${theme}: expanded discovery fits large text on a narrow screen without shrinking touch targets`, async ({
        page,
    }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.setViewportSize({ width: 320, height: 844 })
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.goto('/ko/docs')
        const discovery = docsIndexDiscovery(page)
        await expect(discovery).not.toHaveAttribute('open')
        await page.addStyleTag({ content: 'html { font-size: 24px; }' })
        const summary = docsIndexDiscoverySummary(page)
        await summary.click()
        await expect(discovery).toHaveAttribute('open')
        await expect(summary.locator('svg')).toHaveCSS(
            'transition-duration',
            '0s'
        )
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth
            )
        ).toBeLessThanOrEqual(1)
        for (const link of await discovery.getByRole('link').all()) {
            if (!(await link.isVisible())) continue
            const box = await link.boundingBox()
            expect(box!.height).toBeGreaterThanOrEqual(44)
            expect(box!.x).toBeGreaterThanOrEqual(0)
            expect(box!.x + box!.width).toBeLessThanOrEqual(321)
        }
    })
}

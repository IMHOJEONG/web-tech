import { expect, test } from '@playwright/test'

function getSearchParams(url: URL, keys: readonly string[]) {
    return Object.fromEntries(
        keys.map((key) => [key, url.searchParams.get(key)])
    )
}

test.describe('docs index mobile navigation', () => {
    test.beforeEach(({ page }) => {
        test.skip(
            page.viewportSize()?.width !== 390,
            'This interaction check is scoped to the mobile project.'
        )
    })

    test('preserves filter and sort state in the URL', async ({ page }) => {
        await page.goto('/docs')

        await page.locator('a[href*="section=web"]').first().click()
        await expect
            .poll(() => new URL(page.url()).search)
            .toContain('section=web')

        await page.locator('a[href*="sort=title"]').first().click()
        await expect
            .poll(() =>
                getSearchParams(new URL(page.url()), [
                    'section',
                    'sort',
                    'page',
                ])
            )
            .toEqual({ section: 'web', sort: 'title', page: null })
    })

    test('keeps the search query when a section filter changes', async ({
        page,
    }) => {
        await page.goto('/docs')

        await page.locator('input[name="q"]').fill('React')
        await page
            .locator('form:has(input[name="q"])')
            .getByRole('button')
            .click()
        await expect
            .poll(() => new URL(page.url()).searchParams.get('q'))
            .toBe('React')

        await page.locator('a[href*="section=web"]').first().click()
        await expect
            .poll(() => getSearchParams(new URL(page.url()), ['q', 'section']))
            .toEqual({ q: 'React', section: 'web' })
    })

    test('resets a stale page when a filter changes', async ({ page }) => {
        await page.goto('/docs?page=2&sort=title')

        await page.locator('a[href*="section=web"]').first().click()
        await expect
            .poll(() =>
                getSearchParams(new URL(page.url()), [
                    'page',
                    'section',
                    'sort',
                ])
            )
            .toEqual({ page: null, section: 'web', sort: 'title' })
    })
})

import { expect, test } from '@playwright/test'

test('archived ARIA URLs redirect permanently and preserve locale and query', async ({
    request,
}) => {
    for (const prefix of ['', '/ko', '/en']) {
        for (const alias of [
            '/docs/category/fe/react/test',
            '/docs/drawer-aria-focus-management',
            '/category/fe/react/drawer-aria-focus-management',
            '/category/fe/react/test',
        ]) {
            const response = await request.get(
                `${prefix}${alias}?from=archive`,
                {
                    maxRedirects: 0,
                }
            )
            expect(response.status()).toBe(308)
            const location = new URL(
                response.headers().location!,
                response.url()
            )
            expect(location.pathname).toBe(
                `${prefix}/docs/ui-ux/blocked-aria-hidden`
            )
            expect(location.searchParams.get('from')).toBe('archive')
        }
    }
})

test('canonical ARIA document still renders after duplicate archival', async ({
    page,
}) => {
    await page.goto('/ko/docs/ui-ux/blocked-aria-hidden')
    await expect(page.locator('.mdx-wrapper')).toContainText(
        'Blocked aria-hidden'
    )
})

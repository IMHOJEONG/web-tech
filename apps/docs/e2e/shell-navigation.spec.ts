import { expect, test } from '@playwright/test'

test.describe('docs shell navigation visibility', () => {
    test('mobile keeps drawer access and hides desktop navigation', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 390,
            'This assertion is scoped to the mobile project.'
        )

        await page.goto('/docs')

        await expect(
            page.getByTestId('mobile-nav-drawer-trigger')
        ).toBeVisible()
        await expect(page.getByTestId('desktop-navigation')).toBeHidden()
    })

    test('mobile keeps bottom navigation as the primary footer affordance', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 390,
            'This assertion is scoped to the mobile project.'
        )

        await page.goto('/docs')

        await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible()
        await expect(page.getByTestId('footer-utility-links')).toBeHidden()

        const mobileLinks = page
            .getByTestId('mobile-bottom-nav')
            .getByRole('link')

        await expect(mobileLinks).toHaveCount(5)
        await expect(mobileLinks.nth(3)).toHaveAttribute('href', '/ui-ux')
    })

    test('tablet uses top navigation without bottom navigation or footer utility links', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 768,
            'This assertion is scoped to the tablet project.'
        )

        await page.goto('/docs')

        await expect(page.getByTestId('desktop-navigation')).toBeVisible()
        await expect(page.getByTestId('mobile-nav-drawer-trigger')).toBeHidden()
        await expect(page.getByTestId('mobile-bottom-nav')).toBeHidden()
        await expect(page.getByTestId('footer-utility-links')).toBeHidden()
    })

    test('desktop uses top navigation without mobile shell affordances', async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 1280,
            'This assertion is scoped to the desktop project.'
        )

        await page.goto('/docs')

        await expect(page.getByTestId('desktop-navigation')).toBeVisible()
        await expect(page.getByTestId('mobile-nav-drawer-trigger')).toBeHidden()
        await expect(page.getByTestId('mobile-bottom-nav')).toBeHidden()
        await expect(page.getByTestId('footer-utility-links')).toBeVisible()
    })
})

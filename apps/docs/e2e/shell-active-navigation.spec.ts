import { expect, test, type Page } from '@playwright/test'

async function expectActiveSection(
    page: Page,
    locale: string,
    section: string
) {
    for (const id of ['desktop-navigation', 'mobile-bottom-nav']) {
        const active = page.getByTestId(id).locator('a[aria-current="page"]')
        await expect(active).toHaveCount(1)
        await expect(active).toHaveAttribute('href', `/${locale}/${section}`)
    }

    const trigger = page.getByTestId('mobile-nav-drawer-trigger')
    if (page.viewportSize()!.width < 640) {
        await expect(trigger).toBeVisible()
        await trigger.click()
        const drawer = page.getByRole('dialog')
        await expect(drawer).toBeVisible()
        const active = drawer.locator('a[aria-current="page"]')
        await expect(active).toHaveCount(1)
        await expect(active).toHaveAttribute('href', `/${locale}/${section}`)
        await page.keyboard.press('Escape')
        await expect(drawer).toHaveCount(0)
    }
}

for (const locale of ['ko', 'en']) {
    test(`${locale}: shell menus agree for index, canonical and legacy articles`, async ({
        page,
    }) => {
        test.setTimeout(120_000)
        page.setDefaultTimeout(10_000)
        const hydrationErrors: string[] = []
        const recordError = (message: string) => {
            if (/hydration|hydrated|did not match|#418|#423/i.test(message)) {
                hydrationErrors.push(message)
            }
        }
        page.on('pageerror', (error) => recordError(error.message))
        page.on('console', (message) => {
            if (message.type() === 'error') recordError(message.text())
        })
        await page.emulateMedia({ reducedMotion: 'reduce' })

        for (const [path, section] of [
            ['/docs?q=React', 'feed'],
            ['/docs/ui-ux/focus-management-checklist', 'ui-ux'],
            ['/docs/category/fe/react/server-client-component-boundary', 'web'],
            ['/category/fe/react/server-client-component-boundary', 'web'],
        ] as const) {
            await page.goto(`/${locale}${path}`)
            if (path.startsWith('/category/')) {
                await expect(page).toHaveURL(
                    new RegExp(`/${locale}/docs${path}$`)
                )
            }
            await expect(
                page.locator(section === 'feed' ? 'main' : '.mdx-wrapper')
            ).toBeVisible()
            await expectActiveSection(page, locale, section)
        }

        const mobile = page.viewportSize()!.width < 640
        if (mobile) await page.getByTestId('mobile-nav-drawer-trigger').click()
        const menu = mobile
            ? page.getByRole('dialog')
            : page.getByTestId('desktop-navigation')
        await menu.locator(`a[href="/${locale}/mobile"]`).click()
        await expect(page).toHaveURL(new RegExp(`/${locale}/mobile$`))
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expectActiveSection(page, locale, 'mobile')
        await page.goBack()
        await expectActiveSection(page, locale, 'web')
        expect(hydrationErrors).toEqual([])
    })
}

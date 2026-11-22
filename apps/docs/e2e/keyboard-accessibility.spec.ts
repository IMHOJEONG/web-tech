import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: Escape closes search from every control and restores focus`, async ({
        page,
        browserName,
    }) => {
        await page.goto(`/${locale}/about`)
        const form = page.getByRole('dialog').getByRole('search')
        const trigger = page.getByTestId('search-drawer-trigger')
        const input = form.getByRole('searchbox')
        const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
        const back = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'
        await expect(trigger).toBeEnabled()

        for (const target of ['input', 'clear', 'submit', 'close']) {
            await trigger.press('Enter')
            await expect(input).toBeFocused()
            await input.fill('react')
            if (target === 'clear' || target === 'submit') {
                await page.keyboard.press(tab)
                await expect(
                    form.locator('button[type="button"]').last()
                ).toBeFocused()
            }
            if (target === 'submit') {
                await page.keyboard.press(tab)
                await expect(
                    form.locator('button[type="submit"]')
                ).toBeFocused()
            }
            if (target === 'close') {
                await page.keyboard.press(back)
                await expect(
                    page.getByRole('dialog').getByRole('button', {
                        name: locale === 'ko' ? '검색 닫기' : 'Close search',
                    })
                ).toBeFocused()
            }
            await page.keyboard.press('Escape')
            await expect(trigger).toHaveAttribute('aria-expanded', 'false')
            await expect(input).toBeHidden()
            await expect(trigger).toBeFocused()
        }

        await trigger.press('Enter')
        await expect(input).toBeFocused()
        await expect(input).toHaveValue('react')
        await input.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/${locale}/docs\\?q=react$`))
    })

    test(`${locale}: local article exposes a main landmark and one visible title`, async ({
        page,
    }) => {
        await page.goto(
            `/${locale}/docs/category/fe/react/server-client-component-boundary`
        )
        const main = page.getByRole('main')
        await expect(main).toHaveCount(1)
        await expect(main.locator('.mdx-wrapper')).toBeVisible()
        const title = main.getByRole('heading', { level: 1 })
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(title).toBeVisible()
        await expect(title).toHaveText(
            'Server Component와 Client Component 경계'
        )
        await expect(
            main.getByRole('heading', {
                level: 2,
                name: /경계를 먼저 정해야 하는 이유/,
            })
        ).toBeVisible()
    })
}

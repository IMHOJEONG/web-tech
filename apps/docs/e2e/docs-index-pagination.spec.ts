import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    const labels =
        locale === 'ko'
            ? {
                  navigation: '전체 문서 페이지 이동',
                  previous: '이전',
                  next: '다음',
              }
            : {
                  navigation: 'All documents pagination',
                  previous: 'Previous',
                  next: 'Next',
              }

    for (const boundary of ['first', 'last'] as const) {
        test(`${locale}: ${boundary} page cannot activate the disabled direction`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/docs?sort=title`)
            const navigation = page.getByRole('navigation', {
                name: labels.navigation,
            })
            await expect(navigation).toBeVisible()
            const lastPage = await navigation
                .getByRole('link', { name: /^\d+$/ })
                .last()
                .innerText()
            if (boundary === 'last') {
                await navigation
                    .getByRole('link', { name: lastPage, exact: true })
                    .click()
                await expect(
                    navigation.locator('[aria-current="page"]')
                ).toHaveText(lastPage)
            }

            const disabled = navigation.getByRole('link', {
                name: boundary === 'first' ? labels.previous : labels.next,
                exact: true,
            })
            const beforeUrl = page.url()
            await expect(disabled).toHaveAttribute('aria-disabled', 'true')
            expect(await disabled.getAttribute('href')).toBeNull()
            expect(
                await disabled.evaluate(
                    (element) => (element as HTMLElement).tabIndex
                )
            ).toBe(-1)

            // A real pointer click must not navigate; Playwright's locator.click rejects aria-disabled.
            await disabled.scrollIntoViewIfNeeded()
            const bounds = (await disabled.boundingBox())!
            await page.mouse.click(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2
            )
            await expect(page).toHaveURL(beforeUrl)

            await page.getByRole('main').focus()
            await disabled.evaluate((element) =>
                (element as HTMLElement).focus()
            )
            await expect(page.getByRole('main')).toBeFocused()
            await page.keyboard.press('Enter')
            await expect(page).toHaveURL(beforeUrl)

            // Adjacent number links remain in the tab order; the disabled control does not.
            const numberLink = navigation.getByRole('link', { name: /^\d+$/ })
            await (
                boundary === 'first' ? numberLink.first() : numberLink.last()
            ).focus()
            await page.keyboard.press(
                boundary === 'first' ? 'Shift+Tab' : 'Tab'
            )
            await expect(disabled).not.toBeFocused()
            await expect(
                navigation.locator('[aria-current="page"]')
            ).toHaveText(boundary === 'first' ? '1' : lastPage)
        })
    }

    test(`${locale}: enabled directions preserve sorting with mouse and keyboard`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/docs?sort=title`)
        const navigation = page.getByRole('navigation', {
            name: labels.navigation,
        })
        await navigation
            .getByRole('link', { name: labels.next, exact: true })
            .click()
        await expect(page).toHaveURL(
            new RegExp(`/${locale}/docs\\?page=2&sort=title$`)
        )
        await expect(navigation.locator('[aria-current="page"]')).toHaveText(
            '2'
        )
        const previous = navigation.getByRole('link', {
            name: labels.previous,
            exact: true,
        })
        await previous.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(
            new RegExp(`/${locale}/docs\\?sort=title$`)
        )
        await expect(navigation.locator('[aria-current="page"]')).toHaveText(
            '1'
        )
    })
}

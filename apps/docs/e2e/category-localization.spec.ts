import { expect, test } from '@playwright/test'
import ko from '../shared/message/ko.json' with { type: 'json' }
import en from '../shared/message/en.json' with { type: 'json' }

for (const [locale, { category: copy }] of [
    ['ko', ko],
    ['en', en],
] as const) {
    test(`${locale}: category index localizes navigation and summaries`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/category`)
        const main = page.getByRole('main')
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            copy.index.title
        )
        await expect(
            main.getByRole('heading', {
                name: copy.index.topicsTitle,
                exact: true,
            })
        ).toBeVisible()
        await expect(
            main.getByText(copy.summaries.groups.fe, { exact: true })
        ).toBeVisible()
        const link = main.locator(`a[href="/${locale}/category/fe"]`)
        await expect(link).toHaveCount(1)
        await link.click()
        await expect(page).toHaveURL(`/${locale}/category/fe`)
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            copy.main.title
        )
    })

    test(`${locale}: technical topics localize summaries and keep document titles`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/category/fe`)
        const main = page.getByRole('main')
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            copy.main.title
        )
        await expect(
            main.getByText(copy.summaries.topics.react, { exact: true })
        ).toBeVisible()
        await main.locator(`a[href="/${locale}/category/fe/react"]`).click()
        await expect(page).toHaveURL(`/${locale}/category/fe/react`)
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            copy.sub.title
        )
        await expect(
            main.getByRole('heading', {
                name: copy.sub.documentsTitle,
                exact: true,
            })
        ).toBeVisible()
        await expect(
            main.getByText(copy.latestUpdate, { exact: true })
        ).toBeVisible()
        await expect(
            main.locator(
                `a[href="/${locale}/docs/category/fe/react/server-client-component-boundary"]`
            )
        ).toContainText('Server Component와 Client Component 경계')
    })

    test(`${locale}: topic statistics localize labels but preserve article language`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/category/be/node-js`)
        const main = page.getByRole('main')
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            copy.sub.title
        )
        await expect(
            main
                .locator('.ds-panel-muted')
                .getByText(copy.documentCountLabel, { exact: true })
        ).toBeVisible()
        await expect(
            main.getByText(copy.latestUpdate, { exact: true })
        ).toBeVisible()
        await expect(
            main.locator(
                `a[href="/${locale}/docs/category/be/node-js/http-timeout-retry-boundary"]`
            )
        ).toContainText('HTTP Timeout과 Retry 경계')
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth
            )
        ).toBe(false)
    })
}

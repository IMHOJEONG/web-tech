import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: remote canonical channels survive index filters and hubs alongside local documents`, async ({
        page,
    }) => {
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))

        // Direct URL checks intentionally bypass the browser Router Cache.
        await page.goto(`/${locale}/docs?q=Taxonomy%20fixture`)
        for (const channel of ['web', 'ui-ux', 'mobile']) {
            await expect(
                page.locator(
                    `main a[href="/${locale}/docs/${channel}/taxonomy-fixture"]`
                )
            ).toHaveCount(1)
        }

        for (const [filter, channel] of [
            ['web', 'web'],
            ['uiux', 'ui-ux'],
            ['mobile', 'mobile'],
        ] as const) {
            await page.goto(
                `/${locale}/docs?q=Taxonomy%20fixture&section=${filter}`
            )
            const cards = page.locator('main a').filter({
                has: page.getByRole('heading', {
                    name: /^Taxonomy fixture /,
                }),
            })
            await expect(cards).toHaveCount(1)
            await expect(cards).toHaveAttribute(
                'href',
                `/${locale}/docs/${channel}/taxonomy-fixture`
            )
            await page.goto(`/${locale}/${channel}`)
            await expect(
                page
                    .locator(
                        `main a[href="/${locale}/docs/${channel}/taxonomy-fixture"]`
                    )
                    .first()
            ).toBeVisible()
        }

        await page.goto(`/${locale}/docs?q=server-component&section=web`)
        await expect(
            page.locator(
                `main a[href="/${locale}/docs/category/fe/react/server-client-component-boundary"]`
            )
        ).toHaveCount(1)
        expect(errors).toEqual([])
    })
}

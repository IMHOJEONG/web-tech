import { expect, test } from '@playwright/test'

test('synthetic taxonomy bodies are fixed and unknown paths never echo input', async ({
    request,
}) => {
    const origin = 'http://127.0.0.1:3112'
    const headers = { Authorization: 'Bearer article-e2e-only-token' }
    for (const channel of ['web', 'ui-ux', 'mobile']) {
        const response = await request.get(
            `${origin}/posts/${channel}/taxonomy-fixture`,
            { headers }
        )
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('text/html')
        expect(await response.text()).toContain(
            `<h1>Taxonomy fixture ${channel}</h1>`
        )
    }
    for (const path of [
        'unknown',
        encodeURIComponent('<script>alert(1)</script>'),
    ]) {
        const response = await request.get(
            `${origin}/posts/${path}/taxonomy-fixture`,
            { headers }
        )
        expect(response.status()).toBe(404)
        expect(await response.text()).toBe('Not found')
    }
    expect(
        (await request.get(`${origin}/posts/web/taxonomy-fixture`)).status()
    ).toBe(401)
})

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

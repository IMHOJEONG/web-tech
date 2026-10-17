import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: tags and collections survive reload and allow ordered reading`, async ({
        page,
    }, testInfo) => {
        await page.goto(`/${locale}/docs`)
        const tags = page.getByTestId('content-tag-filters')
        await tags.getByRole('link', { name: /^#react / }).click()
        await expect(page).toHaveURL(/tag=react/)
        await expect(
            tags.getByRole('link', { name: /^#react / })
        ).toHaveAttribute('aria-current', 'true')
        await page.reload()
        await expect(
            tags.getByRole('link', { name: /^#react / })
        ).toHaveAttribute('aria-current', 'true')
        await tags
            .getByRole('link', {
                name: locale === 'ko' ? '전체 태그' : 'All tags',
                exact: true,
            })
            .click()
        await expect(page).toHaveURL(new RegExp(`/${locale}/docs$`))
        await expect(
            tags.getByRole('link', {
                name: locale === 'ko' ? '전체 태그' : 'All tags',
                exact: true,
            })
        ).toHaveAttribute('aria-current', 'true')
        const collections = page.getByTestId('content-collections')
        await collections
            .getByRole('link', {
                name: /브라우저 런타임 노트|Browser runtime notes/,
            })
            .click()
        await expect(page).toHaveURL(/collection=browser-runtime/)
        const steps = collections.locator('ol a')
        await expect(steps).toHaveCount(2)
        await expect(steps.first()).toHaveAttribute(
            'href',
            `/${locale}/docs/web/bytecode`
        )
        await collections.screenshot({
            path: testInfo.outputPath('reading-collection.png'),
        })
        await steps.first().focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(
            new RegExp(`/${locale}/docs/web/bytecode$`)
        )
        await page.goBack()
        await expect(steps).toHaveCount(2)
        await collections
            .getByRole('link', {
                name: locale === 'ko' ? '모음 해제' : 'Clear collection',
            })
            .click()
        await expect(page).toHaveURL(new RegExp(`/${locale}/docs$`))
    })
}

test('unknown filters do not silently broaden results and fit a 320px screen', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.goto('/ko/docs?tag=unavailable&collection=unknown')
    await expect(
        page.getByRole('heading', { name: '조건에 맞는 문서가 없어요' })
    ).toBeVisible()
    await page
        .getByRole('link', { name: '전체 문서 보기', exact: true })
        .click()
    await expect(page).toHaveURL(/\/ko\/docs$/)
    await page.getByTestId('content-tag-filters').locator('summary').click()
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true)
    for (const link of await page
        .getByTestId('content-tag-filters')
        .getByRole('link')
        .all()) {
        const box = await link.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(44)
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320)
    }
    await page
        .getByTestId('content-tag-filters')
        .screenshot({ path: testInfo.outputPath('tags-320.png') })
})

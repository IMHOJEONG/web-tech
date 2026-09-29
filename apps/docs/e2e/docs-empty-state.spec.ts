import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: empty search has landmarks, suggestions and a working recovery link`, async ({
        page,
    }) => {
        await page.goto(`/${locale}/docs?q=no-match-empty-state-20260923`)
        const main = page.getByRole('main')
        await expect(main).toHaveCount(1)
        await expect(main).toHaveAttribute('id', 'main-content')
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            locale === 'ko' ? '검색 결과가 없어요' : 'No matching documents'
        )
        if (locale === 'en') await expect(main).not.toContainText(/[가-힣]/)
        const suggestions = main.getByRole('navigation', {
            name: locale === 'ko' ? '추천 검색어' : 'Suggested searches',
        })
        await expect(
            suggestions.getByRole('link', { name: 'React', exact: true })
        ).toHaveAttribute('href', `/${locale}/docs?q=React`)
        await suggestions
            .getByRole('link', { name: 'React', exact: true })
            .click()
        await expect(page).toHaveURL(new RegExp(`/${locale}/docs\\?q=React$`))
        await expect(main.getByRole('heading', { level: 1 })).toContainText(
            'React'
        )

        await page.goBack()
        const recovery = main.getByRole('link', {
            name: locale === 'ko' ? '전체 문서로 돌아가기' : 'Back to all docs',
            exact: true,
        })
        await recovery.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/${locale}/docs$`))
        await expect(main).toHaveCount(1)
    })

    test(`${locale}: long empty query stays readable without page overflow`, async ({
        page,
    }) => {
        const keyword = 'no-match-'.repeat(30)
        await page.goto(`/${locale}/docs?q=${keyword}`)
        const main = page.getByRole('main')
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            locale === 'ko' ? '검색 결과가 없어요' : 'No matching documents'
        )
        await expect(main).not.toContainText(keyword)
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth
            )
        ).toBe(true)
    })
}

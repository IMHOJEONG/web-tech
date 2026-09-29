import { expect, test } from '@playwright/test'

test('direct URL and API use the first query, collapse whitespace and cap length', async ({
    page,
    request,
}) => {
    const q = `  ${'가'.repeat(45)}  `
    const params = new URLSearchParams([
        ['q', q],
        ['q', 'ignored'],
    ])
    const response = await request.get(`/api/search?${params}`)
    expect(response.ok()).toBe(true)
    expect((await response.json()).query).toBe('가'.repeat(40))
    await page.goto(`/ko/docs?${params}`)
    const header = page.getByRole('search', { name: '문서 검색', exact: true })
    await header.locator('button[aria-expanded]').click()
    await expect(header.locator('input')).toHaveValue('가'.repeat(40))
    await page.goto(`/ko/docs?q=%20React%20%20Suspense%20&q=ignored`)
    await expect(page.getByRole('main')).toContainText('React Suspense')
    await page.goto('/ko/docs?q=&q=ignored')
    await expect(page.getByRole('main').locator('input[name="q"]')).toHaveValue(
        ''
    )
})

for (const location of ['header', 'index'] as const) {
    test(`${location}: length, IME and submit share the same rules`, async ({
        page,
    }) => {
        await page.goto('/ko/docs')
        const form =
            location === 'header'
                ? page.getByRole('search', { name: '문서 검색', exact: true })
                : page.getByRole('main').getByRole('search')
        if (location === 'header')
            await form.locator('button[aria-expanded]').click()
        const input = form.locator('input')
        await input.fill('🙂'.repeat(41))
        await expect(input).toHaveValue('🙂'.repeat(40))
        await input.dispatchEvent('compositionstart')
        await input.fill('가'.repeat(41))
        await expect(input).toHaveValue('가'.repeat(41))
        const before = page.url()
        await input.press('Enter')
        await expect(page).toHaveURL(before)
        await input.dispatchEvent('compositionend', { data: '가' })
        await expect(input).toHaveValue('가'.repeat(40))
        await input.fill('  React   Suspense  ')
        await form.locator('button[type="submit"]').click()
        await expect
            .poll(() => new URL(page.url()).searchParams.get('q'))
            .toBe('React Suspense')
        await expect(page.getByRole('main')).toContainText('React Suspense')
    })
}

import { expect, test } from '@playwright/test'

test('an image failure uses a local backup without breaking the document card', async ({
    page,
}) => {
    await page.route('**/*', (route) => {
        if (route.request().resourceType() !== 'image') return route.continue()
        const url = new URL(route.request().url())
        const source = url.searchParams.get('url') ?? url.pathname
        return source.startsWith('/default/')
            ? route.continue()
            : route.abort('failed')
    })
    await page.goto('/ko/web')
    const backup = page.locator('[data-thumbnail-state="fallback"]').first()
    await expect(backup).toBeVisible()
    await expect
        .poll(() =>
            backup
                .locator('img')
                .evaluate(
                    (image: HTMLImageElement) =>
                        image.complete && image.naturalWidth > 0
                )
        )
        .toBe(true)
    const card = backup.locator('xpath=ancestor::a[1]')
    const href = await card.getAttribute('href')
    expect(href).toMatch(/^\/ko\/docs\//)
    await card.click()
    await expect(page).toHaveURL(new RegExp(href! + '$'))
    await expect(page.locator('[data-offline-content]')).toBeVisible()
})

test('even a failed backup leaves a usable card and does not retry forever', async ({
    page,
}) => {
    let requests = 0
    await page.route('**/*', (route) => {
        if (route.request().resourceType() !== 'image') return route.continue()
        requests++
        return route.abort('failed')
    })
    await page.goto('/ko/feed')
    await expect(
        page.locator('[data-thumbnail-state="unavailable"]').first()
    ).toBeVisible()
    const before = requests
    await expect(
        page.locator('[data-thumbnail-state="unavailable"] img')
    ).toHaveCount(0)
    await page.getByRole('heading', { level: 1 }).waitFor()
    expect(requests).toBe(before)
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
        )
    ).toBe(true)
})

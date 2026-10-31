import { expect, test } from '@playwright/test'
import { openArticleFromCard } from './article-navigation'

test('an image failure uses a local backup without breaking the document card', async ({
    page,
}, info) => {
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
    await openArticleFromCard(page, card, info)
})

test('even a failed backup leaves a usable card and does not retry forever', async ({
    page,
}, info) => {
    let requests = 0
    await page.route('**/*', (route) => {
        if (route.request().resourceType() !== 'image') return route.continue()
        requests++
        return route.abort('failed')
    })
    // Text-only Feed rows omit thumbnails; Web exercises real image failures.
    await page.goto('/ko/web')
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
    const card = page
        .locator('[data-thumbnail-state="unavailable"]')
        .first()
        .locator('xpath=ancestor::a[1]')
    await openArticleFromCard(page, card, info)
})

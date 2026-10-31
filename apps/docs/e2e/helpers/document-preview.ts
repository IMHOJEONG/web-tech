import { expect, type Locator } from '@playwright/test'

export async function expectEditorialPreview(card: Locator) {
    await expect(card).toBeVisible()
    await expect(card.locator('a, button, input, svg')).toHaveCount(0)
    expect(
        await card.evaluate(
            (element) => element.scrollWidth <= element.clientWidth
        )
    ).toBe(true)
    const images = card.locator('img')
    expect(await images.count()).toBeLessThanOrEqual(1)
    for (const image of await images.all()) {
        await expect(image).toHaveAttribute('alt', '')
        const source = await image.getAttribute('src')
        expect(decodeURIComponent(source!)).not.toContain('/default/')
        expect((await image.boundingBox())!.height).toBeLessThanOrEqual(112)
    }
}

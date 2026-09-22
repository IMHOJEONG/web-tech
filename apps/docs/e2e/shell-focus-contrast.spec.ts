import { expect, test, type Locator } from '@playwright/test'

// Shell controls use solid backgrounds; composite their ancestor alpha layers.
async function contrast(locator: Locator, pseudo?: string) {
    return locator.evaluate((element, pseudo) => {
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 1
        const context = canvas.getContext('2d')!
        const rgba = (color: string) => {
            context.clearRect(0, 0, 1, 1)
            context.fillStyle = color
            context.fillRect(0, 0, 1, 1)
            return [...context.getImageData(0, 0, 1, 1).data].map(
                (value, index) => (index === 3 ? value / 255 : value)
            )
        }
        const background = (node: Element | null): number[] => {
            if (!node) return [255, 255, 255]
            const color = rgba(getComputedStyle(node).backgroundColor)
            const below = background(node.parentElement)
            return color
                .slice(0, 3)
                .map(
                    (value, index) =>
                        value * color[3]! + below[index]! * (1 - color[3]!)
                )
        }
        const luminance = (color: number[]) =>
            color
                .map((value) => {
                    const channel = value / 255
                    return channel <= 0.04045
                        ? channel / 12.92
                        : ((channel + 0.055) / 1.055) ** 2.4
                })
                .reduce(
                    (sum, value, index) =>
                        sum + value * [0.2126, 0.7152, 0.0722][index]!,
                    0
                )
        const bg = background(element)
        const fg = rgba(getComputedStyle(element, pseudo).color)
        const foreground = luminance(
            fg
                .slice(0, 3)
                .map(
                    (value, index) => value * fg[3]! + bg[index]! * (1 - fg[3]!)
                )
        )
        const backdrop = luminance(bg)
        return (
            (Math.max(foreground, backdrop) + 0.05) /
            (Math.min(foreground, backdrop) + 0.05)
        )
    }, pseudo)
}

for (const theme of ['light', 'dark']) {
    test(`${theme}: shell focus, contrast and landmark names`, async ({
        page,
    }) => {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.goto('/ko/web')
        await expect
            .poll(() =>
                page
                    .locator('html')
                    .evaluate((el) => el.classList.contains('dark'))
            )
            .toBe(theme === 'dark')
        await page.keyboard.press('Tab')
        const skip = page.getByRole('link', { name: '본문으로 바로가기' })
        await expect(skip).toBeFocused()
        await expect(skip).toHaveCSS('outline-style', 'solid')
        await expect(skip).toHaveCSS('outline-width', '2px')
        expect(await contrast(skip)).toBeGreaterThanOrEqual(4.5)

        const mobile = page.viewportSize()!.width < 640
        if (mobile)
            await page.getByTestId('mobile-nav-drawer-trigger').press('Enter')
        const nav = page.getByRole('navigation', {
            name: '주요 메뉴',
            exact: true,
        })
        await expect(nav).toHaveCount(1)
        const active = nav.locator('a[aria-current="page"]')
        expect(await contrast(active)).toBeGreaterThanOrEqual(4.5)
        await active.focus()
        await expect(active).toHaveCSS('outline-style', 'solid')
        await expect(active).toHaveCSS('outline-width', '2px')
        if (mobile) await page.keyboard.press('Escape')

        const search = page.getByRole('search', {
            name: '문서 검색',
            exact: true,
        })
        await expect(search).toHaveCount(1)
        await search.locator('button[aria-expanded]').press('Enter')
        const input = search.getByRole('textbox', {
            name: '문서를 검색해보세요',
        })
        await expect(input).toBeFocused()
        await expect(input).toHaveCSS('outline-style', 'solid')
        await expect(input).toHaveCSS('outline-width', '2px')
        expect(await contrast(input)).toBeGreaterThanOrEqual(4.5)
        expect(await contrast(input, '::placeholder')).toBeGreaterThanOrEqual(
            4.5
        )
        expect(
            await contrast(search.locator('button[type="submit"]'))
        ).toBeGreaterThanOrEqual(3)
        await input.fill('react')
        await page.keyboard.press('Tab')
        const clear = search.getByRole('button', { name: '검색어 지우기' })
        await expect(clear).toBeFocused()
        await expect(clear).toHaveCSS('outline-style', 'solid')
        expect(await contrast(clear)).toBeGreaterThanOrEqual(3)
        await page.emulateMedia({ forcedColors: 'active' })
        await expect(clear).toHaveCSS('outline-style', 'solid')
        await expect(clear).toHaveCSS('outline-width', '2px')
    })
}

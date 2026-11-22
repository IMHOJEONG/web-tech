import { expect, test } from '@playwright/test'
import { openDrawerWithKeyboard } from './helpers/keyboard-drawer'

for (const locale of ['ko', 'en']) {
    for (const id of ['mobile-nav-drawer-trigger', 'search-drawer-trigger']) {
        test(
            locale +
                ': ' +
                id +
                ' waits for hydration before keyboard activation',
            async ({ page }) => {
                await page.setViewportSize({ width: 390, height: 844 })
                await page.emulateMedia({ reducedMotion: 'reduce' })
                await page.addInitScript(
                    (theme) => localStorage.setItem('theme', theme),
                    locale === 'ko' ? 'light' : 'dark'
                )
                let release!: () => void
                const gate = new Promise<void>((resolve) => {
                    release = resolve
                })
                const match = /\/_next\/static\/.*\.js(?:\?|$)/
                await page.route(match, async (route) => {
                    await gate
                    await route.continue()
                })
                try {
                    await page.goto('/' + locale + '/web', {
                        waitUntil: 'domcontentloaded',
                    })
                    const trigger = page.getByTestId(id)
                    await expect(trigger).toBeVisible()
                    await expect(trigger).toBeDisabled()
                    // The previous unguarded operation completes without opening.
                    await trigger.press('Enter')
                    await expect(trigger).toHaveAttribute(
                        'aria-expanded',
                        'false'
                    )
                    await expect(page.getByRole('dialog')).toHaveCount(0)
                    const opening = openDrawerWithKeyboard(trigger)
                    await expect(trigger).toBeDisabled()
                    release()
                    await opening
                    await expect(page.getByRole('dialog')).toHaveCount(1)
                    if (id === 'mobile-nav-drawer-trigger') {
                        await expect(
                            page.getByRole('navigation', {
                                name:
                                    locale === 'ko'
                                        ? '주요 메뉴'
                                        : 'Primary navigation',
                                exact: true,
                            })
                        ).toHaveCount(1)
                    } else {
                        await expect(
                            page.getByRole('dialog').getByRole('combobox')
                        ).toBeFocused()
                    }
                    await page.keyboard.press('Escape')
                    await expect(page.getByRole('dialog')).toHaveCount(0)
                    await expect(trigger).toBeFocused()
                } finally {
                    release()
                    await page.unrouteAll({ behavior: 'wait' })
                }
            }
        )
    }
}

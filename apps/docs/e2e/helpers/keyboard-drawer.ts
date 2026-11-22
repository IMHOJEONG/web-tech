import { expect, type Locator } from '@playwright/test'

export async function openDrawerWithKeyboard(trigger: Locator) {
    // press() does not wait for enabled state, unlike pointer activation.
    await expect(trigger).toBeVisible()
    await expect(trigger).toBeEnabled()
    await trigger.focus()
    await expect(trigger).toBeFocused()
    await trigger.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
}

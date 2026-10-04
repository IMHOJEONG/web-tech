import { expect, test } from '@playwright/test'
import { preparePackedUiConsumer } from '../scripts/test-utils/packed-ui-consumer'

let consumer: Awaited<ReturnType<typeof preparePackedUiConsumer>>
test.beforeAll(async () => {
    test.setTimeout(240_000)
    consumer = await preparePackedUiConsumer()
})
test.afterAll(async () => {
    await consumer?.cleanup()
})

test('packed UI retains theme, keyboard, tooltip relation and panel focus', async ({
    page,
}, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('http://packed-ui.test/**', (route) => {
        const url = new URL(route.request().url())
        if (url.pathname === '/bundle.js')
            return route.fulfill({
                contentType: 'text/javascript',
                body: consumer.bundle,
            })
        if (url.pathname === '/styles.css')
            return route.fulfill({
                contentType: 'text/css',
                body: consumer.css,
            })
        return route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html lang="en" class="${testInfo.project.name === 'dark' ? 'dark' : ''}"><meta charset="utf-8"><title>Packed UI</title><link rel="stylesheet" href="/styles.css"><body><div id="root"></div><script src="/bundle.js"></script></body></html>`,
        })
    })
    await page.goto('http://packed-ui.test/')
    const counter = page.locator('#counter')
    await expect(counter).toHaveCSS('height', '36px')
    await expect(counter).toHaveCSS('background-color', 'rgb(249, 115, 22)')
    await expect(page.locator('body')).toHaveCSS(
        'color',
        testInfo.project.name === 'dark'
            ? 'rgb(237, 237, 237)'
            : 'rgb(23, 23, 23)'
    )
    await counter.focus()
    await page.keyboard.press('Enter')
    await expect(counter).toHaveText('Count 1')
    await expect(counter).not.toHaveCSS('box-shadow', 'none')
    await page.locator('#tip').focus()
    await expect(page.getByRole('tooltip')).toHaveText(
        'External package tooltip'
    )
    await expect(page.locator('#tip')).toHaveAccessibleDescription(
        'External package tooltip'
    )
    await page.keyboard.press('Escape')
    await page.locator('#open').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close panel', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('#open')).toBeFocused()
    expect(errors).toEqual([])
})

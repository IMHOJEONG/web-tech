import { readFile } from 'node:fs/promises'
import { chromium, expect } from '@playwright/test'

const source = await readFile(
    new URL('../data/shadcn/dialog-focus-restoration.mdx', import.meta.url),
    'utf8'
)
const html = source.match(/```html\n([\s\S]*?)\n```/)?.[1]
if (!html) throw new Error('Article HTML example missing')

const browser = await chromium.launch()
try {
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    console.log('Chromium', browser.version())

    for (const close of ['Escape', 'cancel', 'remove']) {
        // setContent alone preserves global script bindings between examples.
        await page.goto('about:blank')
        await page.setContent(html)
        await page.locator('#open').focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('#cancel')).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(page.locator('#remove')).toBeFocused()
        await page.keyboard.press('Shift+Tab')
        await expect(page.locator('#cancel')).toBeFocused()

        if (close === 'Escape') await page.keyboard.press('Escape')
        else if (close === 'cancel') await page.keyboard.press('Enter')
        else {
            await page.keyboard.press('Tab')
            await page.keyboard.press('Enter')
        }

        await expect(page.locator('#confirm')).not.toBeVisible()
        await expect(
            page.locator(close === 'remove' ? '#list-title' : '#open')
        ).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(page.locator('#next')).toBeFocused()
        console.log(
            'PASS',
            close,
            'initial focus / tab / restoration / next Tab'
        )
    }

    const withoutFallback = html.replace(
        /dialog\.addEventListener\('close',\s*\(\) => \{\s*if \(!trigger\.isConnected\) \{\s*listTitle\.focus\(\);?\s*\}\s*\}\);?/,
        ''
    )
    if (withoutFallback === html)
        throw new Error('Fallback removal did not match')
    await page.goto('about:blank')
    await page.setContent(withoutFallback)
    await page.locator('#open').focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('#confirm')).not.toBeVisible()
    await expect(page.locator('#list-title')).not.toBeFocused()
    console.log(
        'WITHOUT FALLBACK',
        await page.evaluate(() => ({
            tag: document.activeElement?.tagName,
            id: document.activeElement?.id,
        }))
    )
    expect(errors).toEqual([])
    console.log('PASS no page errors')
} finally {
    await browser.close()
}

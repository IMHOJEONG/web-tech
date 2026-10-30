import { chromium, expect } from '@playwright/test'

const port = Number.parseInt(process.env.DOCS_E2E_PORT ?? '3047', 10)
const browser = await chromium.launch()
let releaseScripts: () => void = () => {}
const gate = new Promise<void>((resolve) => {
    releaseScripts = resolve
})
try {
    const page = await browser.newPage({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/*', async (route) => {
        if (route.request().resourceType() === 'script') await gate
        await route.continue()
    })
    const url = `http://127.0.0.1:${port}/ko/feed`
    const response = await page.request.get(url)
    expect(response.ok()).toBe(true)
    const html = await response.text()
    const navigation = page.goto(url)
    void navigation.catch(() => {})
    await expect(page.locator('[data-testid="feed-lead-story"]')).toBeVisible()
    await expect(page.locator('[data-page-pending]')).toHaveCount(0)
    // Deliberately recreate the old test's mutation before React takes ownership.
    const handle = await page.evaluateHandle((html) => {
        const parsed = new DOMParser().parseFromString(html, 'text/html')
        const pending = parsed.querySelector('[data-page-pending="feed"]')
        const main = document.querySelector('main')
        if (!pending || !main) throw new Error('Missing probe markup')
        const injected = document.importNode(pending, true)
        main.replaceWith(injected)
        return injected
    }, html)
    const before = await handle.evaluate((el) => ({
        connected: el.isConnected,
        children: el.querySelectorAll('*').length,
        animations: Array.from(el.querySelectorAll('*')).filter(
            (node) => getComputedStyle(node).animationName !== 'none'
        ).length,
    }))
    releaseScripts()
    await navigation
    await expect.poll(() => handle.evaluate((el) => el.isConnected)).toBe(false)
    const after = await handle.evaluate((el) => ({
        connected: el.isConnected,
        children: el.querySelectorAll('*').length,
        animations: Array.from(el.querySelectorAll('*')).filter(
            (node) => getComputedStyle(node).animationName !== 'none'
        ).length,
        computedAnimationNames: [
            ...new Set(
                Array.from(
                    el.querySelectorAll('*'),
                    (node) => getComputedStyle(node).animationName
                )
            ),
        ],
    }))
    const hydrationErrorObserved = errors.some((error) =>
        /hydration|hydrated/i.test(error)
    )
    expect(before.connected).toBe(true)
    expect(before.animations).toBe(0)
    expect(after.animations).toBe(after.children)
    expect(after.computedAnimationNames).toEqual([''])
    expect(hydrationErrorObserved).toBe(true)
    console.log(
        JSON.stringify({ before, after, hydrationErrorObserved }, null, 2)
    )
} finally {
    releaseScripts()
    await browser.close()
}

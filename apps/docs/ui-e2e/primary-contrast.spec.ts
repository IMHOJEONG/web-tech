import { expect, test } from '@playwright/test'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { fileURLToPath } from 'node:url'
import { solidContrast } from './helpers/solid-contrast'

let script = '',
    css = ''
test.beforeAll(async () => {
    script = (
        await build({
            entryPoints: [
                fileURLToPath(
                    new URL('./fixtures/primary-contrast.tsx', import.meta.url)
                ),
            ],
            bundle: true,
            write: false,
            format: 'iife',
            platform: 'browser',
            jsx: 'automatic',
            define: { 'process.env.NODE_ENV': '"development"' },
        })
    ).outputFiles[0]!.text
    css = (
        await postcss([tailwind()]).process(
            '@import "@web-tech/tailwind-config"; @source "../../../packages/ui/components"; @source "../../../packages/ui/lib"; @source "./fixtures"; html, body { background: var(--background); }',
            { from: fileURLToPath(new URL('./test.css', import.meta.url)) }
        )
    ).css
})

test.beforeEach(async ({ page }) => {
    await page.route('http://primary.test/**', (route) => {
        const pathname = new URL(route.request().url()).pathname
        if (pathname === '/ui.js')
            return route.fulfill({
                contentType: 'text/javascript',
                body: script,
            })
        if (pathname === '/ui.css')
            return route.fulfill({ contentType: 'text/css', body: css })
        return route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Primary contrast</title><link rel="stylesheet" href="/ui.css"></head><body><div id="root"></div><script src="/ui.js"></script></body></html>',
        })
    })
    await page.goto('http://primary.test/')
    await expect(
        page.getByRole('button', { name: 'Primary action', exact: true })
    ).toBeVisible()
})

test('primary text retains AA contrast in default and hover states', async ({
    page,
}, testInfo) => {
    const measurements = []
    for (const selector of [
        '#primary',
        '#small',
        '#cta',
        '#badge',
        '#badge-anchor',
    ]) {
        const node = page.locator(selector)
        await page.mouse.move(0, 0)
        await expect
            .poll(async () => (await solidContrast(node)).ratio)
            .toBeGreaterThanOrEqual(4.5)
        measurements.push({
            selector,
            state: 'default',
            ...(await solidContrast(node)),
        })
        await node.hover()
        await expect
            .poll(async () => (await solidContrast(node)).ratio)
            .toBeGreaterThanOrEqual(4.5)
        // Read after transitions finish, not just the first passing frame.
        await expect
            .poll(() =>
                node.evaluate(
                    (el) =>
                        el
                            .getAnimations()
                            .filter((a) => a.playState === 'running').length
                )
            )
            .toBe(0)
        const result = await solidContrast(node)
        expect(result.ratio).toBeGreaterThanOrEqual(4.5)
        measurements.push({ selector, state: 'hover', ...result })
    }
    await testInfo.attach('computed-contrast.json', {
        body: JSON.stringify(measurements),
        contentType: 'application/json',
    })
})

test('primary actions retain keyboard focus, activation and disabled semantics', async ({
    page,
}, testInfo) => {
    await page.keyboard.press('Tab')
    const primary = page.locator('#primary')
    await expect(primary).toBeFocused()
    await expect(primary).toHaveCSS('outline-style', 'solid')
    await expect(primary).toHaveCSS('outline-width', '2px')
    await expect
        .poll(() =>
            primary.evaluate(
                (el) =>
                    el.getAnimations().filter((a) => a.playState === 'running')
                        .length
            )
        )
        .toBe(0)
    const focus = await solidContrast(primary, true)
    expect((await solidContrast(primary)).ratio).toBeGreaterThanOrEqual(4.5)
    expect(focus.ratio).toBeGreaterThanOrEqual(3)
    await page.keyboard.press('Enter')
    await expect(page.locator('#activations')).toHaveText('1')
    await page.keyboard.press('Space')
    await expect(page.locator('#activations')).toHaveText('2')
    await page.keyboard.press('Tab')
    await expect(page.locator('#small')).toBeFocused()
    await page.keyboard.press('Tab')
    const cta = page.getByRole('link', { name: 'Read articles' })
    await expect(cta).toBeFocused()
    await expect(cta).toHaveCSS('outline-style', 'solid')
    await expect(cta).toHaveCSS('outline-width', '2px')
    await expect
        .poll(() =>
            cta.evaluate(
                (el) =>
                    el.getAnimations().filter((a) => a.playState === 'running')
                        .length
            )
        )
        .toBe(0)
    expect((await solidContrast(cta, true)).ratio).toBeGreaterThanOrEqual(3)
    expect((await solidContrast(cta)).ratio).toBeGreaterThanOrEqual(4.5)
    await expect(page.locator('#disabled')).toBeDisabled()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#destination$/)
    const badgeLink = page.getByRole('link', { name: 'Article category' })
    await badgeLink.focus()
    await expect(badgeLink).toHaveCSS('outline-style', 'solid')
    await expect(badgeLink).toHaveCSS('outline-width', '2px')
    await expect
        .poll(() =>
            badgeLink.evaluate(
                (el) =>
                    el.getAnimations().filter((a) => a.playState === 'running')
                        .length
            )
        )
        .toBe(0)
    expect((await solidContrast(badgeLink, true)).ratio).toBeGreaterThanOrEqual(
        3
    )
    expect((await solidContrast(badgeLink)).ratio).toBeGreaterThanOrEqual(4.5)
    await page.emulateMedia({ forcedColors: 'active' })
    const highlight = await page.evaluate(() => {
        const probe = document.createElement('span')
        probe.style.color = 'Highlight'
        document.body.append(probe)
        const color = getComputedStyle(probe).color
        probe.remove()
        return color
    })
    for (const target of [primary, cta, badgeLink]) {
        await target.focus()
        await expect(target).toHaveCSS('outline-style', 'solid')
        await expect(target).toHaveCSS('outline-width', '2px')
        await expect(target).toHaveCSS('outline-color', highlight)
    }
    await testInfo.attach('focus.json', {
        body: JSON.stringify(focus),
        contentType: 'application/json',
    })
})

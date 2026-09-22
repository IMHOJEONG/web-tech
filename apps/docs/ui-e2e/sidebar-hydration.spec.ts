import { expect, test } from '@playwright/test'
import { build } from 'esbuild'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { fileURLToPath } from 'node:url'
import { SidebarHydration } from './fixtures/sidebar-hydration'

let bundle = ''
let html = ''

test.beforeAll(async () => {
    html = renderToString(createElement(SidebarHydration))
    const result = await build({
        entryPoints: [
            fileURLToPath(
                new URL(
                    './fixtures/sidebar-hydration-client.tsx',
                    import.meta.url
                )
            ),
        ],
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"development"' },
    })
    bundle = result.outputFiles[0]!.text
})

for (const width of [390, 767, 768, 1280]) {
    test(`Sidebar hydrates without mismatch at ${width}px and tracks breakpoint changes`, async ({
        page,
    }) => {
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text())
        })
        await page.setViewportSize({ width, height: 844 })
        await page.route('http://sidebar.test/**', (route) =>
            route.fulfill({
                contentType: 'text/html',
                body: `<!doctype html><html lang="en"><head><title>Sidebar hydration</title></head><body><div id="root">${html}</div></body></html>`,
            })
        )
        await page.goto('http://sidebar.test/')
        const viewport = page.getByTestId('viewport')
        await expect(viewport).toHaveText('desktop')
        await page.addScriptTag({ content: bundle })
        await expect(viewport).toHaveText(width < 768 ? 'mobile' : 'desktop')

        await page.setViewportSize({ width: 767, height: 844 })
        await expect(viewport).toHaveText('mobile')
        await page.getByRole('button', { name: 'Toggle sidebar' }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByTestId('mobile-open')).toHaveText('true')
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)

        await page.setViewportSize({ width: 768, height: 844 })
        await expect(viewport).toHaveText('desktop')
        await expect(page.locator('[data-slot="sidebar"]')).toHaveCount(1)
        expect(errors).toEqual([])
    })
}

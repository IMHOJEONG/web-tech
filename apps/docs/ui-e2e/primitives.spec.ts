import { expect, test, type Page } from '@playwright/test'
import { build } from 'esbuild'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { fileURLToPath } from 'node:url'

let bundle = ''
let css = ''
let bundleInputs: string[] = []
const pageErrors = new WeakMap<Page, string[]>()

test.beforeAll(async () => {
    const result = await build({
        entryPoints: [
            fileURLToPath(
                new URL('./fixtures/primitives.tsx', import.meta.url)
            ),
        ],
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        jsx: 'automatic',
        metafile: true,
        define: { 'process.env.NODE_ENV': '"development"' },
    })
    bundle = result.outputFiles[0]!.text
    bundleInputs = Object.keys(result.metafile.inputs)
    css = (
        await postcss([tailwind()]).process(
            '@import "@web-tech/tailwind-config"; @import "tw-animate-css"; @source "../../../packages/ui/components"; @source "../../../packages/ui/lib"; @source "./fixtures";',
            { from: fileURLToPath(new URL('./test.css', import.meta.url)) }
        )
    ).css
})

test.beforeEach(async ({ page }) => {
    const errors: string[] = []
    pageErrors.set(page, errors)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('http://ui.test/**', (route) => {
        const path = new URL(route.request().url()).pathname
        if (path === '/lab.js')
            return route.fulfill({
                contentType: 'text/javascript',
                body: bundle,
            })
        if (path === '/lab.css')
            return route.fulfill({ contentType: 'text/css', body: css })
        return route.fulfill({
            contentType: 'text/html',
            body: '<!doctype html><html lang="en"><meta charset="utf-8"><title>Shared UI regression</title><link rel="stylesheet" href="/lab.css"><body><div id="root"></div><script src="/lab.js"></script></body></html>',
        })
    })
    await page.goto('http://ui.test/')
    await expect(page.locator('#default')).toBeVisible()
})

test.afterEach(async ({ page }) => {
    expect(pageErrors.get(page)).toEqual([])
})

test('shared UI uses Base UI subpaths without direct Radix primitives', () => {
    expect(
        bundleInputs.some((path) => path.endsWith('/radix-ui/dist/index.js'))
    ).toBe(false)
    expect(
        bundleInputs.filter((path) => /\/@radix-ui\/react-/.test(path))
    ).toEqual([])
    expect(
        bundleInputs.some((path) => /\/@base-ui\/react\/button\//.test(path))
    ).toBe(true)
})

test('Button sizes retain defaults and allow explicit touch target overrides', async ({
    page,
}) => {
    await expect(page.locator('#default')).toHaveCSS('height', '36px')
    await expect(page.locator('#xs')).toHaveCSS('height', '24px')
    await expect(page.locator('#xs svg')).toHaveCSS('width', '12px')
    await expect(page.locator('#icon-xs')).toHaveCSS('width', '24px')
    await expect(page.locator('#icon-xs')).toHaveCSS('height', '24px')
    await expect(page.locator('#override')).toHaveCSS('width', '44px')
    await expect(page.locator('#override svg')).toHaveCSS('width', '20px')
    await expect(page.locator('#xs')).toHaveAttribute('data-size', 'xs')
})

test('Button preserves keyboard activation and disabled semantics while styled links stay links', async ({
    page,
}) => {
    await page.locator('#xs').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#clicks')).toHaveText('1')
    await expect(page.locator('#disabled')).toBeDisabled()
    await page
        .locator('#disabled')
        .evaluate((button: HTMLButtonElement) => button.click())
    await expect(page.locator('#clicks')).toHaveText('1')
    await page.locator('#override').focus()
    await page.keyboard.press('Tab')
    await expect(page.locator('#link-button')).toBeFocused()
    await expect(page.getByRole('link', { name: 'Link button' })).toHaveCount(1)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#destination$/)
})

test('render composes refs and click handlers without accidental form submission', async ({
    page,
}) => {
    await page.locator('#composed').click()
    await expect(page.locator('#composition-results')).toHaveText('1/1/0/false')
    await expect(page.locator('#composed')).toHaveCSS('height', '44px')
    await page.locator('#focus-composed').click()
    await expect(page.locator('#composed')).toBeFocused()
    await expect(page.locator('#composition-results')).toHaveText('1/1/0/true')
    await page.keyboard.press('Space')
    await expect(page.locator('#composition-results')).toHaveText('2/2/0/true')
})

test('controlled Tooltip preserves existing descriptions and cleans its relation on close', async ({
    page,
}) => {
    const trigger = page.locator('#controlled-tooltip')
    await trigger.focus()
    const tooltip = page.getByRole('tooltip')
    await expect(tooltip).toHaveText('Additional explanation.')
    await expect(trigger).toHaveAccessibleDescription(
        'Existing explanation. Additional explanation.'
    )
    await page.keyboard.press('Escape')
    await expect(tooltip).toHaveCount(0)
    await expect(trigger).toHaveAttribute(
        'aria-describedby',
        'extra-description'
    )
})

test('cancelled and disabled Tooltips do not expose a dangling description', async ({
    page,
}) => {
    for (const id of ['cancelled-tooltip', 'disabled-tooltip']) {
        await page.locator(`#${id}`).hover()
        await page.locator(`#${id}`).focus()
        await expect(page.getByRole('tooltip')).toHaveCount(0)
        await expect(page.locator(`#${id}`)).not.toHaveAttribute(
            'aria-describedby'
        )
    }
})

test('Badge exposes variants and preserves token colors and link semantics', async ({
    page,
}) => {
    await expect(page.locator('#badge-default')).toHaveAttribute(
        'data-variant',
        'default'
    )
    await expect(page.locator('#badge-outline')).toHaveAttribute(
        'data-variant',
        'outline'
    )
    await expect(page.locator('#badge-ghost')).toHaveAttribute(
        'data-variant',
        'ghost'
    )
    await expect(page.locator('#badge-ghost')).toHaveCSS(
        'border-top-color',
        'rgba(0, 0, 0, 0)'
    )
    const primary = await page
        .locator('#default')
        .evaluate((node) => getComputedStyle(node).backgroundColor)
    await expect(page.locator('#badge-default')).toHaveCSS(
        'background-color',
        primary
    )
    await expect(page.locator('#badge-link')).toHaveCSS('color', primary)
    const link = page.getByRole('link', { name: 'Linked badge' })
    await link.hover()
    await expect(link).toHaveCSS('text-decoration-line', 'underline')
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#destination$/)
})

test('Tooltip respects the outer provider hover delay', async ({ page }) => {
    await page.clock.install()
    await page.locator('#delayed').hover()
    await page.clock.runFor(500)
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    await page.clock.runFor(600)
    await expect(page.getByRole('tooltip')).toHaveText(
        'Provider delay is respected'
    )
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
})

test('Tooltip supports immediate default hover and keyboard focus', async ({
    page,
}) => {
    await page.locator('#instant').hover()
    await expect(page.getByRole('tooltip')).toHaveText('Default delay is zero')
    await expect(page.locator('#instant')).toHaveAccessibleDescription(
        'Default delay is zero'
    )
    await page.mouse.move(1000, 600, { steps: 10 })
    await expect(page.getByRole('tooltip')).toHaveCount(0)
    await page.locator('#delayed').focus()
    await expect(page.getByRole('tooltip')).toHaveText(
        'Provider delay is respected'
    )
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toHaveCount(0)
})

test('Sidebar supplies the Tooltip provider for collapsed menu buttons', async ({
    page,
}) => {
    await page.getByRole('button', { name: 'Sidebar destination' }).hover()
    await expect(page.getByRole('tooltip')).toHaveText('Sidebar destination')
    await expect(
        page.getByRole('button', { name: 'Sidebar destination' })
    ).toHaveAttribute('data-popup-open')
})

test('Sidebar render preserves anchor semantics without nested buttons', async ({
    page,
}) => {
    const link = page.getByRole('link', { name: 'Sidebar link' })
    await expect(link).toHaveAttribute('data-sidebar', 'menu-button')
    await expect(link.locator('button')).toHaveCount(0)
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#destination$/)
})

test('Input, Collapsible and Separator retain public behavior', async ({
    page,
}) => {
    await page
        .getByRole('textbox', { name: 'Example input' })
        .fill('Typed value')
    await expect(page.locator('#input')).toHaveValue('Typed value')
    await page.locator('#collapse').focus()
    await page.keyboard.press('Enter')
    await expect(
        page.getByText('Expanded content', { exact: true })
    ).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(
        page.getByText('Expanded content', { exact: true })
    ).toHaveCount(0)
    await expect(page.getByRole('separator')).toHaveAttribute(
        'data-orientation',
        'horizontal'
    )
})

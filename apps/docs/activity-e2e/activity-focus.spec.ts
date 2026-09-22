import { expect, test, type Page } from '@playwright/test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

let bundle = ''
const pageErrors = new WeakMap<Page, string[]>()

test.describe('official Sheet close button API', () => {
    test('omitting the option keeps the default close button', async ({
        page,
    }, info) => {
        await load(page, Boolean(info.project.metadata.strict))
        await page.locator('#dialog-trigger').click()
        const close = page.getByRole('button', { name: 'Close', exact: true })
        await expect(close).toHaveCount(1)
        await close.click()
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expect(page.locator('#dialog-trigger')).toBeFocused()
    })

    test('false removes only the default close button, not custom actions', async ({
        page,
    }, info) => {
        await load(page, Boolean(info.project.metadata.strict), 'no-close')
        await page.locator('#dialog-trigger').click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(
            page.getByRole('button', { name: 'Close', exact: true })
        ).toHaveCount(0)
        await expect(page.locator('#leave-view')).toBeVisible()
        await expect(page.locator('#close')).toBeVisible()
        await expect(page.locator('#dialog-content')).not.toHaveAttribute(
            'showclosebutton'
        )
        await page.locator('#close').click()
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expect(page.locator('#dialog-trigger')).toBeFocused()
    })

    test('false preserves keyboard closing and focus restoration', async ({
        page,
    }, info) => {
        await load(page, Boolean(info.project.metadata.strict), 'no-close')
        await page.locator('#dialog-trigger').focus()
        await page.keyboard.press('Enter')
        await expect(page.locator('#dialog-input')).toBeFocused()
        await page.keyboard.press('Tab')
        await expect(page.locator('#close')).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expect(page.locator('#dialog-trigger')).toBeFocused()
    })
})

test.beforeAll(async () => {
    const result = await build({
        entryPoints: [
            fileURLToPath(
                new URL('./fixtures/activity-lab.tsx', import.meta.url)
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

async function load(page: Page, strict: boolean, policy = 'default') {
    const errors: string[] = []
    pageErrors.set(page, errors)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('http://activity.test/**', (route) => {
        if (new URL(route.request().url()).pathname === '/lab.js') {
            return route.fulfill({
                contentType: 'text/javascript',
                body: bundle,
            })
        }
        return route.fulfill({
            contentType: 'text/html',
            body: `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Activity focus lab</title>
                <style>body { font: 16px sans-serif; padding: 24px; } button,input { margin: 8px; padding: 8px; }
                [data-slot=sheet-overlay] { position: fixed; inset: 0; background: #0008; }
                [data-slot=sheet-content] { position: fixed; inset: 15% 20%; background: white; padding: 24px; }
                :focus-visible { outline: 3px solid #175cd3; }</style>
                <div id="root"></div><script src="/lab.js"></script></html>`,
        })
    })
    await page.goto(`http://activity.test/?strict=${strict}&policy=${policy}`)
    await expect(page.locator('#draft')).toBeVisible()
    await expect
        .poll(() => eventCount(page, 'effect:setup'))
        .toBe(strict ? 2 : 1)
}

function eventCount(page: Page, name: string) {
    return page.evaluate(
        (name) =>
            window.activityLab.events.filter((event) => event.name === name)
                .length,
        name
    )
}

async function toggleHitTarget(page: Page) {
    return page.locator('#toggle').evaluate((button) => {
        const bounds = button.getBoundingClientRect()
        const hit = document.elementFromPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2
        )
        return hit?.getAttribute('data-slot') ?? hit?.id
    })
}

test.afterEach(async ({ page, browser }, info) => {
    if (await page.evaluate(() => Boolean(window.activityLab))) {
        await info.attach('activity-observations.json', {
            contentType: 'application/json',
            body: JSON.stringify(
                {
                    browser: browser.version(),
                    strict: info.project.metadata.strict,
                    ...(await page.evaluate(() => window.activityLab)),
                    snapshot: await page.evaluate(() => ({
                        activeElement:
                            document.activeElement?.id ||
                            document.activeElement?.tagName,
                        state: document.getElementById('state')?.textContent,
                        overlayCount: document.querySelectorAll(
                            '[data-slot="sheet-overlay"]'
                        ).length,
                        paneDisplay: document.getElementById('pane')
                            ? getComputedStyle(document.getElementById('pane')!)
                                  .display
                            : null,
                    })),
                    toggleHitTarget: await toggleHitTarget(page),
                    pageErrors: pageErrors.get(page) ?? [],
                },
                null,
                2
            ),
        })
    }
    expect(pageErrors.get(page) ?? []).toEqual([])
})

test('hidden preserves DOM and state but cleans up effects', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict))
    const input = await page.locator('#draft').elementHandle()
    await page.locator('#draft').fill('preserved draft')
    await page.locator('#count').click()
    const setups = await eventCount(page, 'effect:setup')
    const cleanups = await eventCount(page, 'effect:cleanup')
    await page.locator('#toggle').click()
    await expect(page.locator('#pane')).toBeHidden()
    await expect
        .poll(() => eventCount(page, 'effect:cleanup'))
        .toBe(cleanups + 1)
    expect(await input!.evaluate((node) => node.isConnected)).toBe(true)
    await page.locator('#toggle').click()
    await expect(page.locator('#draft')).toHaveValue('preserved draft')
    await expect(page.locator('#count')).toHaveText('count: 1')
    expect(
        await input!.evaluate(
            (node) => node === document.querySelector('#draft')
        )
    ).toBe(true)
    await expect
        .poll(() => eventCount(page, 'effect:setup'))
        .toBe(setups + (info.project.metadata.strict ? 2 : 1))
})

test('a connected hidden input cannot receive focus', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict))
    const input = await page.locator('#draft').elementHandle()
    await page.locator('#toggle').click()
    await expect(page.locator('#pane')).toBeHidden()
    const connected = await input!.evaluate((node) => {
        node.focus()
        return node.isConnected
    })
    expect(connected).toBe(true)
    await expect(page.locator('#toggle')).toBeFocused()
    await expect(page.locator('#draft')).not.toBeFocused()
})

test('actual unmount disconnects DOM and resets state', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict))
    const input = await page.locator('#draft').elementHandle()
    await page.locator('#draft').fill('discarded')
    await page.locator('#count').click()
    await page.locator('#mount').click()
    await expect(page.locator('#pane')).toHaveCount(0)
    expect(await input!.evaluate((node) => node.isConnected)).toBe(false)
    await page.locator('#mount').click()
    await expect(page.locator('#draft')).toHaveValue('')
    await expect(page.locator('#count')).toHaveText('count: 0')
})

test('unconditional cleanup focus steals focus on hide', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict), 'cleanup-focus')
    const cleanups = await eventCount(page, 'effect:cleanup')
    await page.locator('#toggle').click()
    await expect
        .poll(() => eventCount(page, 'effect:cleanup'))
        .toBe(cleanups + 1)
    await expect(page.locator('#old-trigger')).toBeFocused()
    await expect(page.locator('#pane')).toHaveCount(1)
    await expect(page.locator('#pane')).toBeHidden()
})

test('normal Sheet close restores a visible trigger', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict))
    await page.locator('#dialog-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('#dialog-trigger')).toBeFocused()
})

test('hiding an open Sheet leaves the portal blocking the next view', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict))
    await page.locator('#dialog-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    const callbacks = await eventCount(page, 'dialog:close-auto-focus')
    await page.locator('#leave-view').click()
    await expect(page.locator('#pane')).toBeHidden()
    await expect
        .poll(() => eventCount(page, 'dialog:close-auto-focus'))
        .toBeGreaterThan(callbacks)
    await expect(page.locator('#state')).toHaveText('false / true')
    await expect(page.locator('#dialog-trigger')).not.toBeFocused()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await toggleHitTarget(page)).toBe('sheet-overlay')
})

test('same-commit close and hide still leave a portal inside Activity', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict), 'guarded')
    await page.locator('#dialog-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('#leave-view').click()
    await expect(page.locator('#state')).toHaveText('false / false')
    await expect(page.locator('#toggle')).toBeFocused()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await toggleHitTarget(page)).toBe('sheet-overlay')
})

test('keeping Sheet lifecycle outside Activity permits close and return', async ({
    page,
}, info) => {
    await load(page, Boolean(info.project.metadata.strict), 'isolated')
    await page.locator('#dialog-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.locator('#leave-view').click()
    await expect(page.locator('#state')).toHaveText('false / false')
    await expect(page.locator('#toggle')).toBeFocused()
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0)
    expect(await toggleHitTarget(page)).toBe('toggle')
    await page.locator('#toggle').click()
    await expect(page.locator('#pane')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.locator('#dialog-trigger').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#dialog-trigger')).toBeFocused()
})

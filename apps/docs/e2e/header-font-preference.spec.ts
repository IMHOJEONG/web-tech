import { chromium, expect, test, type Page } from '@playwright/test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

async function expectHeaderFits(page: Page) {
    const header = page.getByRole('banner')
    await expect(
        header.getByRole('link', { name: 'HEAP-FORGE', exact: true })
    ).toBeVisible()
    const rectangles = await header
        .locator('a:visible, button:visible')
        .evaluateAll((nodes) =>
            nodes.map((node) => {
                const { left, top, right, bottom } =
                    node.getBoundingClientRect()
                return {
                    left,
                    top,
                    right,
                    bottom,
                    label: node.textContent || node.getAttribute('aria-label'),
                }
            })
        )
    const width = await page.evaluate(() => innerWidth)
    for (let index = 0; index < rectangles.length; index++) {
        const current = rectangles[index]!
        expect(current.left, String(current.label)).toBeGreaterThanOrEqual(0)
        expect(current.right, String(current.label)).toBeLessThanOrEqual(
            width + 1
        )
        for (const next of rectangles.slice(index + 1)) {
            const overlaps =
                current.left < next.right - 1 &&
                current.right > next.left + 1 &&
                current.top < next.bottom - 1 &&
                current.bottom > next.top + 1
            expect(overlaps, `${current.label} / ${next.label}`).toBe(false)
        }
    }
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width + 1)
    await expect
        .poll(() =>
            header.evaluate((node) => {
                const height = Number.parseFloat(
                    getComputedStyle(document.documentElement).getPropertyValue(
                        '--docs-header-height'
                    )
                )
                return Math.abs(height - node.getBoundingClientRect().height)
            })
        )
        .toBeLessThan(1)
}

for (const locale of ['ko', 'en']) {
    test(`${locale}: enlarged root font reflows the narrow header and search`, async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()?.width !== 1280,
            'Run the width sweep once.'
        )
        await page.goto(`/${locale}/docs/web/javascript-event-loop-runtime`)
        await page.evaluate(() => {
            document.documentElement.style.fontSize = '32px'
        })
        for (const width of [320, 390, 500]) {
            await page.setViewportSize({ width, height: 900 })
            await expectHeaderFits(page)
            const header = page.getByRole('banner')
            const trigger = header.locator('form button[aria-controls]')
            await trigger.click()
            const input = header.getByRole('textbox')
            await expect(input).toBeFocused()
            const panel = page.locator(
                `[id="${await trigger.getAttribute('aria-controls')}"]`
            )
            expect((await panel.boundingBox())!.y).toBeGreaterThanOrEqual(
                (await header.boundingBox())!.height
            )
            await input.press('Escape')
            await expect(trigger).toBeFocused()
            await page.getByTestId('mobile-nav-drawer-trigger').click()
            await expect(page.getByRole('dialog')).toBeVisible()
            await page.keyboard.press('Escape')
            await expect(page.getByRole('dialog')).toBeHidden()
        }
        const heading = page.locator('.mdx-wrapper h2').first()
        await heading.evaluate((node) =>
            node.scrollIntoView({ block: 'start', behavior: 'instant' })
        )
        expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(
            (await page.getByRole('banner').boundingBox())!.height
        )
        await page.evaluate(() => {
            document.documentElement.style.removeProperty('font-size')
        })
        await page.setViewportSize({ width: 390, height: 844 })
        await expect(page.getByRole('banner')).toHaveCSS('height', '65px')
    })
}

test('native browser default font respects layout without a CSS override', async ({
    baseURL,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'chromium-desktop',
        'Use isolated desktop Chromium profiles once.'
    )
    test.setTimeout(120_000)
    const directory = await mkdtemp(join(tmpdir(), 'docs-header-font-'))
    const results: {
        width: number
        fontSize: number
        locale: string
        headerHeight: number
    }[] = []
    const extension = join(directory, 'extension')
    await mkdir(extension)
    await writeFile(
        join(extension, 'manifest.json'),
        JSON.stringify({
            manifest_version: 3,
            name: 'Header font regression fixture',
            version: '1.0',
            permissions: ['fontSettings'],
            background: { service_worker: 'worker.js' },
        })
    )
    await writeFile(
        join(extension, 'worker.js'),
        'chrome.runtime.onInstalled.addListener(() => {});'
    )
    try {
        for (const width of [500, 640, 1280]) {
            const context = await chromium.launchPersistentContext(
                join(directory, `profile-${width}`),
                {
                    channel: 'chromium',
                    headless: true,
                    viewport: null,
                    args: [
                        `--disable-extensions-except=${extension}`,
                        `--load-extension=${extension}`,
                        `--window-size=${width},900`,
                    ],
                }
            )
            try {
                const worker =
                    context.serviceWorkers()[0] ??
                    (await context.waitForEvent('serviceworker'))
                for (const fontSize of [16, 32]) {
                    await worker.evaluate(async (pixelSize) => {
                        const chrome = (
                            globalThis as unknown as {
                                chrome: {
                                    fontSettings: {
                                        setDefaultFontSize: (value: {
                                            pixelSize: number
                                        }) => Promise<void>
                                    }
                                }
                            }
                        ).chrome
                        await chrome.fontSettings.setDefaultFontSize({
                            pixelSize,
                        })
                    }, fontSize)
                    for (const locale of ['ko', 'en']) {
                        const page = await context.newPage()
                        try {
                            await page.goto(`${baseURL}/${locale}/web`)
                            await page.evaluate(() => document.fonts.ready)
                            expect(await page.evaluate(() => innerWidth)).toBe(
                                width
                            )
                            expect(
                                await page
                                    .locator('html')
                                    .evaluate(
                                        (node) =>
                                            getComputedStyle(node).fontSize
                                    )
                            ).toBe(`${fontSize}px`)
                            expect(
                                await page
                                    .locator('html')
                                    .evaluate((node) => node.style.fontSize)
                            ).toBe('')
                            await expectHeaderFits(page)
                            results.push({
                                width,
                                fontSize,
                                locale,
                                headerHeight: (await page
                                    .getByRole('banner')
                                    .boundingBox())!.height,
                            })
                            await page.getByRole('banner').screenshot({
                                path: testInfo.outputPath(
                                    `header-${locale}-${width}-font${fontSize}.png`
                                ),
                            })
                        } finally {
                            await page.close()
                        }
                    }
                }
            } finally {
                await context.close()
            }
        }
    } finally {
        await testInfo.attach('native-font-preference', {
            body: JSON.stringify(
                { browser: 'Chromium', baseURL, results },
                null,
                2
            ),
            contentType: 'application/json',
        })
        await rm(directory, { recursive: true, force: true })
    }
})

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { chromium, expect, type Page } from '@playwright/test'
const headed = process.argv.includes('--headed')
const channel = process.argv.includes('--chrome') ? 'chrome' : undefined
const repeat = Number(
    process.argv.find((arg) => arg.startsWith('--repeat='))?.split('=')[1] ?? 1
)
assert.ok(Number.isInteger(repeat) && repeat >= 1 && repeat <= 3)
const origin = 'https://heap-forge.app'
const browser = await chromium.launch({ headless: !headed, channel })
const results: object[] = []
let failed = false

function trigger(page: Page) {
    return page
        .getByRole('banner')
        .locator('form button[type="button"][aria-expanded][aria-controls]')
}

try {
    for (let iteration = 0; iteration < repeat; iteration++) {
        for (const locale of ['ko', 'en']) {
            for (const width of [1280, 390]) {
                const context = await browser.newContext({
                    viewport: { width, height: 844 },
                })
                const sample: Record<string, unknown> = {
                    iteration,
                    locale,
                    width,
                    headed,
                    channel: channel ?? 'bundled-chromium',
                }
                results.push(sample)
                try {
                    const page = await context.newPage()
                    const errors: string[] = []
                    page.on('pageerror', (error) => errors.push(error.name))
                    await page.goto(`${origin}/${locale}/web`, {
                        waitUntil: 'networkidle',
                        timeout: 30000,
                    })
                    const opener = trigger(page)
                    await expect(opener).toHaveCount(1)
                    const broad = page.getByRole('button', {
                        name: locale === 'ko' ? '문서 검색' : 'Search docs',
                        exact: true,
                    })
                    sample.broadMatchesBeforeOpen = await broad.count()
                    await opener.click()
                    await expect(opener).toHaveAttribute(
                        'aria-expanded',
                        'true'
                    )
                    const input = page.getByRole('banner').getByRole('textbox')
                    await expect(input).toBeVisible()
                    await expect(input).toBeFocused()
                    sample.broadMatchesAfterOpen = await broad.count()
                    if (locale === 'ko') {
                        await assert.rejects(
                            broad.getAttribute('aria-expanded'),
                            /strict mode violation/
                        )
                        sample.ambiguousReadRejected = true
                    }
                    await input.press('Escape')
                    await expect(opener).toHaveAttribute(
                        'aria-expanded',
                        'false'
                    )
                    await expect(opener).toBeFocused()
                    await opener.press('Enter')
                    await expect(input).toBeFocused()
                    const identity = randomUUID()
                    await page.evaluate(
                        (value) =>
                            Reflect.set(
                                window,
                                '__publicSearchIdentity',
                                value
                            ),
                        identity
                    )
                    const documentRequests: string[] = []
                    page.on('request', (request) => {
                        if (
                            request.isNavigationRequest() &&
                            request.frame() === page.mainFrame()
                        )
                            documentRequests.push(
                                new URL(request.url()).pathname
                            )
                    })
                    await input.fill('React')
                    await input.press('Enter')
                    await page.waitForURL(
                        (url) =>
                            url.pathname === `/${locale}/docs` &&
                            url.searchParams.get('q') === 'React',
                        { waitUntil: 'commit', timeout: 30000 }
                    )
                    await expect(page.getByRole('main')).toContainText('React')
                    const card = page
                        .getByRole('main')
                        .locator(`a[href^="/${locale}/docs/"]`)
                        .first()
                    const href = await card.getAttribute('href')
                    assert.ok(href)
                    await Promise.all([
                        page.waitForURL(new URL(href, origin).href, {
                            waitUntil: 'commit',
                            timeout: 30000,
                        }),
                        card.click(),
                    ])
                    await expect(
                        page.locator('[data-offline-content]')
                    ).toBeVisible()
                    await expect(
                        page.locator(
                            '[data-offline-content] [data-offline-loading]'
                        )
                    ).toHaveCount(0)
                    await expect(
                        page.locator('[data-offline-content]')
                    ).toContainText(/\S/)
                    assert.equal(
                        await page.evaluate(
                            (value) =>
                                Reflect.get(
                                    window,
                                    '__publicSearchIdentity'
                                ) === value,
                            identity
                        ),
                        true
                    )
                    assert.deepEqual(documentRequests, [])
                    assert.deepEqual(errors, [])
                    sample.articlePath = href
                    sample.searchAndArticleStayClientSide = true
                    sample.status = 'passed'
                } catch (error) {
                    failed = true
                    sample.status = 'failed'
                    sample.error =
                        error instanceof Error
                            ? {
                                  name: error.name,
                                  message: error.message
                                      .split('\n')
                                      .slice(0, 4)
                                      .join(' '),
                              }
                            : { name: 'unknown' }
                } finally {
                    await context.close()
                }
            }
        }
    }
} finally {
    await browser.close()
    console.log(
        JSON.stringify(
            {
                recordedAt: new Date().toISOString(),
                browser: browser.version(),
                elapsedClock: Math.round(performance.now()),
                results,
            },
            null,
            2
        )
    )
}
if (failed) process.exitCode = 1

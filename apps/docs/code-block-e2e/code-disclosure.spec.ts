import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { expect, test } from '@playwright/test'
import { normalizeRemoteArticleHtml } from '../widgets/article-detail/model/normalize-remote-article-html'

const code =
    Array.from(
        { length: 28 },
        (_, i) =>
            `const value${i} = ${i}; // ${i === 0 ? 'x'.repeat(240) : '코드'}`
    ).join('\n') + '\n'
const remoteHtml = normalizeRemoteArticleHtml(
    `<pre><code class="language-ts">${code}</code></pre>`
).content
let bundle: string
let css: string

test.beforeAll(async () => {
    const output = await build({
        entryPoints: [new URL('./fixture.tsx', import.meta.url).pathname],
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'iife',
        jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"test"' },
    })
    bundle = output.outputFiles![0]!.text
    css = await readFile(new URL('../app/css/mdx.css', import.meta.url), 'utf8')
})

for (const locale of ['ko', 'en']) {
    for (const dark of [false, true]) {
        test(`${locale} ${dark ? 'dark' : 'light'}: local, remote and Shiki fold and copy whole code`, async ({
            page,
        }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            await page.setContent(
                `<html lang="${locale}" class="${dark ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{--primary:#ff7012;--primary-fixed:#ffb88c;--hf-bg-deep:#171717;--font-mono:monospace;--font-display:sans-serif;--radius-xl:16px;--hf-accent-cold:#8ed0db;--hf-accent-warm:#f9b883}body{margin:16px;background:${dark ? '#111' : '#fff'}}.mdx-wrapper{max-width:900px;margin:auto;min-width:0}${css}</style></head><body><div id="fixture"></div></body></html>`
            )
            await page.evaluate(
                (config) => {
                    window.codeFixture = config
                    Object.defineProperty(navigator, 'clipboard', {
                        configurable: true,
                        value: {
                            writeText: async (value: string) => {
                                if (window.codeCopyFails) {
                                    throw new DOMException(
                                        'Clipboard denied',
                                        'NotAllowedError'
                                    )
                                }
                                window.copiedCode = value
                            },
                        },
                    })
                },
                { code, remoteHtml }
            )
            await page.addScriptTag({ content: bundle })
            expect(await page.evaluate(() => window.innerWidth)).toBe(
                page.viewportSize()!.width
            )

            for (const source of ['local', 'shiki', 'remote']) {
                const frame = page
                    .getByTestId(source)
                    .locator('.mdx-code-frame')
                const details = frame.locator('details')
                const summary = details.locator('summary')
                await expect(summary).toHaveText(
                    locale === 'ko'
                        ? /전체 코드 보기\s*10 \/ 28줄/
                        : /Show full code\s*10 \/ 28 lines/,
                    { useInnerText: true }
                )
                await expect(frame.locator('.mdx-code-preview')).toBeVisible()
                await expect(details.locator('pre')).toBeHidden()
                await expect(details).toHaveCSS('padding-top', '0px')
                await expect(details).toHaveCSS('margin-top', '0px')
                await expect(
                    frame.locator('.mdx-code-disclosure__language')
                ).toHaveCSS('font-size', '10px')
                await expect(
                    frame.locator('.mdx-code-preview code')
                ).not.toContainText('value27')
                if (source === 'remote' && locale === 'ko') {
                    await frame.screenshot({
                        path: test.info().outputPath('collapsed-code.png'),
                    })
                }
                await frame
                    .getByRole('button', {
                        name: locale === 'en' ? 'Copy code' : '코드 복사',
                        exact: true,
                    })
                    .click()
                // Remote HTML already trims outer whitespace during sanitization.
                const expectedCode = source === 'remote' ? code.trim() : code
                expect(
                    await page.evaluate(() => window.copiedCode),
                    `${source}: copy must include all lines, not just the preview`
                ).toBe(expectedCode)
                expect(await details.locator('code').textContent()).toBe(
                    expectedCode
                )
                const copyButton = frame.locator('.mdx-code-copy-button')
                await expect(copyButton).toHaveAttribute(
                    'data-copy-state',
                    'copied'
                )
                await expect(copyButton).toHaveAccessibleName(
                    locale === 'en' ? 'Code copied' : '코드가 복사되었습니다'
                )
                await expect(copyButton).toContainText(
                    locale === 'en' ? 'Copied' : '복사됨'
                )
                expect(
                    (await copyButton.boundingBox())!.height
                ).toBeGreaterThanOrEqual(44)
                expect(
                    (await summary.boundingBox())!.height
                ).toBeGreaterThanOrEqual(44)
                await page.evaluate(() => {
                    window.codeCopyFails = true
                })
                await copyButton.click()
                await expect(copyButton).toHaveAttribute(
                    'data-copy-state',
                    'error'
                )
                await expect(copyButton).toHaveAccessibleName(
                    locale === 'en'
                        ? 'Failed to copy code'
                        : '코드 복사에 실패했습니다'
                )
                await expect(copyButton).toContainText(
                    locale === 'en' ? 'Copy failed' : '복사 실패'
                )
                await expect(copyButton).toHaveAttribute(
                    'data-copy-state',
                    'idle',
                    { timeout: 4000 }
                )
                await expect(copyButton).toHaveAccessibleName(
                    locale === 'en' ? 'Copy code' : '코드 복사'
                )
                await page.evaluate(() => {
                    window.codeCopyFails = false
                })
                await summary.focus()
                await page.keyboard.press('Enter')
                await expect(details).toHaveAttribute('open', '')
                await expect(details.locator('pre')).toBeVisible()
                await expect(details.locator('pre')).toHaveCSS(
                    'margin-top',
                    '0px'
                )
                await expect(details.locator('pre')).toHaveCSS(
                    'border-top-width',
                    '0px'
                )
                await expect(details.locator('pre')).toHaveCSS(
                    'font-size',
                    '14px'
                )
                await expect(frame.locator('.mdx-code-preview')).toBeHidden()
                await expect(summary).toHaveText(
                    locale === 'ko'
                        ? /코드 접기\s*28줄/
                        : /Collapse code\s*28 lines/,
                    { useInnerText: true }
                )
                await page.keyboard.press('Space')
                await expect(details).not.toHaveAttribute('open', '')
                await expect(summary).toBeFocused()
                await summary.click()
                await expect(details).toHaveAttribute('open', '')
                await summary.click()
                await expect(details).not.toHaveAttribute('open', '')
                await page.emulateMedia({ reducedMotion: 'reduce' })
                await expect(summary).toHaveCSS('transition-duration', '0s')
                await expect(copyButton).toHaveCSS('transition-duration', '0s')
                await page.emulateMedia({ reducedMotion: 'no-preference' })
            }
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth
                )
            ).toBe(true)
            expect(errors).toEqual([])
        })
    }
}

test('native disclosure still works with JavaScript disabled', async ({
    browser,
    page,
}) => {
    // Use the same server-output contract without the copy enhancer or React runtime.
    const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: page.viewportSize()!,
    })
    const native = await context.newPage()
    try {
        await native.setContent(
            `<html lang="ko"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{--primary:#ff7012;--hf-bg-deep:#171717;--font-mono:monospace}body{margin:16px}${css}</style></head><body><div class="mdx-wrapper">${remoteHtml}</div></body></html>`
        )
        const details = native.locator('details')
        await expect(details.locator('pre')).toBeHidden()
        await details.locator('summary').click()
        await expect(details.locator('pre')).toBeVisible()
    } finally {
        await context.close()
    }
})

for (const scale of [1.25, 1.5, 2]) {
    test(`320px English footer keeps separate metadata at ${scale * 100}% root text`, async ({
        page,
    }) => {
        await page.setViewportSize({ width: 320, height: 900 })
        await page.setContent(
            `<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{font-size:${16 * scale}px;--hf-bg-deep:#171717;--font-mono:monospace;--font-display:sans-serif}body{margin:16px}${css}</style></head><body><div class="mdx-wrapper">${remoteHtml}</div></body></html>`
        )
        const details = page.locator('details')
        for (const open of [false, true]) {
            if (open) await details.locator('summary').click()
            await expect(details.locator('pre')).toBeVisible({ visible: open })
            await expect(page.locator('.mdx-code-preview')).toBeVisible({
                visible: !open,
            })
            const layout = await details.locator('summary').evaluate((el) => {
                const label = el
                    .querySelector('[data-code-locale="en"]')!
                    .getBoundingClientRect()
                const count = el
                    .querySelector('[data-code-locale="en"] small')!
                    .getBoundingClientRect()
                const language = el
                    .querySelector('.mdx-code-disclosure__language')!
                    .getBoundingClientRect()
                const summary = el.getBoundingClientRect()
                return {
                    separate:
                        label.right <= language.left &&
                        count.right <= language.left,
                    contained:
                        language.right <= summary.right &&
                        label.bottom <= summary.bottom,
                    overflow: document.documentElement.scrollWidth > innerWidth,
                }
            })
            expect(layout).toEqual({
                separate: true,
                contained: true,
                overflow: false,
            })
        }
    })
}

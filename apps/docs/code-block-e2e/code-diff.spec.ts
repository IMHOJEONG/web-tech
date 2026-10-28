import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { expect, test } from '@playwright/test'
import { normalizeRemoteArticleHtml } from '../widgets/article-detail/model/normalize-remote-article-html'

const code =
    [
        '--- a/decode.c',
        '+++ b/decode.c',
        '@@ -1,3 +1,3 @@',
        'if (max_block_type <= 1) {',
        '-    return BROTLI_FALSE;',
        '+    return BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH;',
        '}',
        '+<script>alert("not executed")</script>',
        ...Array.from(
            { length: 22 },
            (_, i) => ` context ${i} ${'x'.repeat(i === 0 ? 180 : 0)}`
        ),
    ].join('\n') + '\n'
const encoded = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
const remoteHtml = normalizeRemoteArticleHtml(
    `<pre><code class="language-diff">${encoded}</code></pre>`
).content
let bundle: string
let css: string

test.beforeAll(async () => {
    const output = await build({
        entryPoints: [new URL('./diff-fixture.tsx', import.meta.url).pathname],
        bundle: true,
        write: false,
        platform: 'browser',
        format: 'iife',
        jsx: 'automatic',
        define: { 'process.env': JSON.stringify({ NODE_ENV: 'test' }) },
    })
    bundle = output.outputFiles![0]!.text
    css = await readFile(new URL('../app/css/mdx.css', import.meta.url), 'utf8')
})

for (const dark of [false, true]) {
    test(`${dark ? 'dark' : 'light'}: diff stays legible, folds and copies across local Shiki and remote`, async ({
        page,
    }) => {
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.setContent(
            `<html lang="ko" class="${dark ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{--primary:#ff7012;--primary-fixed:#ffb88c;--hf-bg-deep:#171717;--font-mono:monospace;--font-display:sans-serif;--hf-accent-cold:#8ed0db;--hf-accent-warm:#f9b883}body{margin:16px;background:${dark ? '#111' : '#fff'}}.mdx-wrapper{max-width:900px;margin:auto;min-width:0}${css}</style></head><body><div id="fixture"></div></body></html>`
        )
        await page.evaluate(
            (config) => {
                window.diffFixture = config
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    value: {
                        writeText: async (text: string) => {
                            window.copiedCode = text
                        },
                    },
                })
            },
            { code, remoteHtml }
        )
        await page.addScriptTag({ content: bundle })

        for (const source of ['local', 'shiki', 'remote']) {
            const frame = page.getByTestId(source).locator('.mdx-code-frame')
            const preview = frame.locator('.mdx-code-preview')
            await expect(preview).toBeVisible()
            const added = preview.locator('.mdx-code-diff-line--added').first()
            const removed = preview
                .locator('.mdx-code-diff-line--removed')
                .first()
            await expect(added).toContainText(
                '+    return BROTLI_DECODER_ERROR'
            )
            await expect(removed).toHaveText('-    return BROTLI_FALSE;')
            await expect(
                preview.locator('.mdx-code-diff-line--meta')
            ).toHaveCount(3)
            await expect(added).toHaveCSS('border-left-width', '2px')
            const styles = await added.evaluate((el) => ({
                color: getComputedStyle(el).color,
                background: getComputedStyle(el).backgroundColor,
            }))
            expect(styles.color).not.toBe(
                await removed.evaluate((el) => getComputedStyle(el).color)
            )
            expect(styles.background).not.toBe('rgba(0, 0, 0, 0)')
            await expect(frame.locator('script')).toHaveCount(0)
            await expect(frame.locator('pre.shiki')).toHaveCount(0)
            await expect(frame.locator('details pre')).toHaveCSS(
                'background-color',
                'rgba(0, 0, 0, 0)'
            )
            await frame
                .getByRole('button', { name: '코드 복사', exact: true })
                .click()
            expect(await page.evaluate(() => window.copiedCode)).toBe(
                source === 'remote' ? code.trim() : code
            )
            const details = frame.locator('details')
            const summary = details.locator('summary')
            await summary.focus()
            await page.keyboard.press('Enter')
            await expect(details).toHaveAttribute('open')
            await expect(preview).toBeHidden()
            const full = details.locator('code')
            expect(await full.textContent()).toBe(
                source === 'remote' ? code.trim() : code
            )
            // One row per source line: block spans must not introduce blank visual rows.
            const geometry = await full
                .locator('.mdx-code-diff-line')
                .evaluateAll((rows) => {
                    const first = rows[3]!,
                        second = rows[4]!
                    return {
                        step:
                            second.getBoundingClientRect().top -
                            first.getBoundingClientRect().top,
                        lineHeight: parseFloat(
                            getComputedStyle(first).lineHeight
                        ),
                    }
                })
            expect(Math.abs(geometry.step - geometry.lineHeight)).toBeLessThan(
                1
            )
            await page.keyboard.press('Enter')
            await expect(details).not.toHaveAttribute('open')
            if (source === 'local')
                await frame.screenshot({
                    path: test
                        .info()
                        .outputPath(`diff-${dark ? 'dark' : 'light'}.png`),
                })
            await page.emulateMedia({
                forcedColors: 'active',
                reducedMotion: 'reduce',
            })
            await expect(added).toHaveCSS('border-left-style', 'double')
            await expect(removed).toHaveCSS('border-left-style', 'dashed')
            await page.emulateMedia({
                forcedColors: 'none',
                reducedMotion: 'no-preference',
            })
        }
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            )
        ).toBe(true)
        expect(errors).toEqual([])
    })
}

test('diff markers, styling and disclosure work without JavaScript at 320px', async ({
    browser,
}) => {
    const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 320, height: 900 },
    })
    try {
        const page = await context.newPage()
        await page.setContent(
            `<html lang="ko"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{--hf-bg-deep:#171717;--font-mono:monospace}body{margin:16px}${css}</style></head><body><div class="mdx-wrapper">${remoteHtml}</div></body></html>`
        )
        await expect(
            page.locator('.mdx-code-preview .mdx-code-diff-line--added').first()
        ).toBeVisible()
        const details = page.locator('details')
        await details.locator('summary').click()
        await expect(details.locator('pre')).toBeVisible()
        expect(await details.locator('code').textContent()).toBe(code.trim())
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            )
        ).toBe(true)
    } finally {
        await context.close()
    }
})

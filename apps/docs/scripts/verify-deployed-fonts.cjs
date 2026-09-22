const { chromium } = require('@playwright/test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
;(async () => {
    const browser = await chromium.launch()
    const results = []
    try {
        for (const slug of ['javascript-event-loop-runtime', 'browser']) {
            const ctx = await browser.newContext()
            const page = await ctx.newPage()
            const response = await page.goto(
                'https://heap-forge.app/ko/docs/web/' + slug,
                { waitUntil: 'load' }
            )
            await page.locator('.mdx-wrapper').waitFor()
            await page.evaluate(() => document.fonts.ready)
            const headers = await response.allHeaders()
            const html = await response.text()
            const headerFonts = (headers.link || '')
                .split(',')
                .filter((x) => /as="font"/.test(x))
            const htmlFonts = (html.match(/<link\b[^>]*>/g) || []).filter(
                (x) => /as="font"/.test(x) && /rel="preload"/.test(x)
            )
            assert.equal(headerFonts.length + htmlFonts.length, 2)
            assert.ok(
                ![...headerFonts, ...htmlFonts].some((x) =>
                    x.includes('JetBrains')
                )
            )
            const data = await page.evaluate(() => ({
                fontRequests: performance
                    .getEntriesByType('resource')
                    .filter((x) => x.name.includes('.woff2'))
                    .map((x) => ({ url: x.name, bytes: x.encodedBodySize })),
                codeFont: [
                    ...document.querySelectorAll('.mdx-wrapper pre code'),
                ]
                    .slice(0, 1)
                    .map((x) => getComputedStyle(x).fontFamily),
                codeFaces: [...document.fonts]
                    .filter((x) => x.family === 'mono')
                    .map((x) => ({
                        weight: x.weight,
                        style: x.style,
                        status: x.status,
                    })),
                bodyChars:
                    document.querySelector('.mdx-wrapper').textContent.length,
            }))
            assert.ok(data.bodyChars > 0)
            assert.equal(data.codeFaces.length, 16)
            const result = {
                slug,
                status: response.status(),
                fontPreloads: [...headerFonts, ...htmlFonts],
                ...data,
            }
            results.push(result)
            console.log(JSON.stringify(result))
            await ctx.close()
        }
        fs.writeFileSync(
            '/tmp/font-browser-smoke.json',
            JSON.stringify(results, null, 2)
        )
    } finally {
        await browser.close()
    }
})().catch((e) => {
    console.error(e)
    process.exitCode = 1
})

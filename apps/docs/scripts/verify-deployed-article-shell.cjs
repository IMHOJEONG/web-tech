const { chromium } = require('@playwright/test')
const fs = require('node:fs')
;(async () => {
    const browser = await chromium.launch()
    const results = []
    try {
        for (const mobile of [false, true])
            for (const slug of ['javascript-event-loop-runtime', 'browser']) {
                const ctx = await browser.newContext({
                    viewport: mobile
                        ? { width: 390, height: 844 }
                        : { width: 1280, height: 800 },
                    isMobile: mobile,
                    hasTouch: mobile,
                    reducedMotion: 'reduce',
                })
                const page = await ctx.newPage()
                const cdp = await ctx.newCDPSession(page)
                await cdp.send('Network.enable')
                await cdp.send('Network.emulateNetworkConditions', {
                    offline: false,
                    latency: 150,
                    downloadThroughput: 200000,
                    uploadThroughput: 93750,
                })
                await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
                await page.addInitScript(() => {
                    const d = (window.__shell = {
                        samples: [],
                        pendingSeen: false,
                        violations: [],
                    })
                    const timer = setInterval(() => {
                        if (
                            !performance.getEntriesByName(
                                'first-contentful-paint'
                            ).length
                        )
                            return
                        const h = document.querySelector('header'),
                            f = document.querySelector('footer'),
                            s = document.querySelector(
                                '[data-testid="article-page-shell"]'
                            )
                        if (!s || !s.getBoundingClientRect().height) return
                        const p = document.querySelector(
                            '[data-testid="article-pending"]'
                        )
                        const pending = !!p?.getBoundingClientRect().height
                        d.pendingSeen ||= pending
                        const v = {
                            at: performance.now(),
                            header: h?.getBoundingClientRect().height ?? 0,
                            footer: f?.getBoundingClientRect().top ?? null,
                            viewport: innerHeight,
                            overflow:
                                document.documentElement.scrollWidth -
                                innerWidth,
                            pending,
                        }
                        d.samples.push(v)
                        if (
                            Math.abs(v.header - 65) > 1 ||
                            (v.footer !== null && v.footer < innerHeight - 1) ||
                            v.overflow > 1
                        )
                            d.violations.push(v)
                    }, 16)
                    window.__stopShell = () => clearInterval(timer)
                })
                const response = await page.goto(
                    'https://heap-forge.app/ko/docs/web/' + slug,
                    { waitUntil: 'load', timeout: 60000 }
                )
                await page.locator('.mdx-wrapper').waitFor()
                await page.waitForTimeout(1000)
                const layout = await page.evaluate(() => {
                    window.__stopShell()
                    return window.__shell
                })
                let anchor = null
                if (!mobile) {
                    const a = page.locator('aside a[href^="#"]').last()
                    if (await a.count()) {
                        const href = await a.getAttribute('href')
                        await a.click()
                        await page.waitForTimeout(600)
                        anchor = await page.evaluate((href) => {
                            const n = document.getElementById(
                                decodeURIComponent(href.slice(1))
                            )
                            return {
                                target: href,
                                top: n?.getBoundingClientRect().top,
                                headerBottom: document
                                    .querySelector('header')
                                    .getBoundingClientRect().bottom,
                            }
                        }, href)
                    }
                }
                results.push({
                    mobile,
                    slug,
                    status: response.status(),
                    ...layout,
                    anchor,
                })
                console.log(
                    JSON.stringify({
                        mobile,
                        slug,
                        status: response.status(),
                        samples: layout.samples.length,
                        pendingSeen: layout.pendingSeen,
                        violations: layout.violations,
                        anchor,
                    })
                )
                await ctx.close()
            }
    } finally {
        await browser.close()
        fs.writeFileSync(
            '/tmp/heap-forge-cls-shell-check.json',
            JSON.stringify(results, null, 2)
        )
    }
})().catch((e) => {
    console.error(e)
    process.exitCode = 1
})

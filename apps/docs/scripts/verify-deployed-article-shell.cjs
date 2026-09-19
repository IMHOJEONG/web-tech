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
                const scrollPositions = []
                for (const fraction of [0, 0.5, 1, 0]) {
                    await page.evaluate((ratio) => {
                        scrollTo({
                            top:
                                (document.documentElement.scrollHeight -
                                    innerHeight) *
                                ratio,
                            behavior: 'instant',
                        })
                    }, fraction)
                    await page.waitForTimeout(100)
                    scrollPositions.push(
                        await page.evaluate(() => {
                            const header = document
                                .querySelector('header')
                                .getBoundingClientRect()
                            return {
                                scrollY,
                                bodyHeight:
                                    document.body.getBoundingClientRect()
                                        .height,
                                documentHeight:
                                    document.documentElement.scrollHeight,
                                viewport: innerHeight,
                                headerTop: header.top,
                                headerHeight: header.height,
                                headerBottom: header.bottom,
                                overflow:
                                    document.documentElement.scrollWidth -
                                    innerWidth,
                            }
                        })
                    )
                }
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
                                headerTop: document
                                    .querySelector('header')
                                    .getBoundingClientRect().top,
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
                    scrollPositions,
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
                        scrollPositions,
                        anchor,
                    })
                )
                await ctx.close()
            }
    } finally {
        await browser.close()
        fs.writeFileSync(
            process.env.SHELL_OUTPUT || '/tmp/heap-forge-cls-shell-check.json',
            JSON.stringify(results, null, 2)
        )
    }
    if (
        results.length !== 4 ||
        results.some(
            (row) =>
                row.status !== 200 ||
                row.samples.length === 0 ||
                row.violations.length > 0 ||
                row.scrollPositions.some(
                    (p) =>
                        Math.abs(p.headerTop) > 1 ||
                        Math.abs(p.headerHeight - 65) > 1 ||
                        p.overflow > 1
                ) ||
                row.scrollPositions[1].scrollY <= 0 ||
                row.scrollPositions[2].scrollY <= 0 ||
                (!row.mobile &&
                    (!row.anchor ||
                        Math.abs(row.anchor.headerTop) > 1 ||
                        Math.abs(row.anchor.headerBottom - 65) > 1 ||
                        !Number.isFinite(row.anchor.top) ||
                        row.anchor.top < row.anchor.headerBottom + 8))
        )
    )
        process.exitCode = 1
})().catch((e) => {
    console.error(e)
    process.exitCode = 1
})

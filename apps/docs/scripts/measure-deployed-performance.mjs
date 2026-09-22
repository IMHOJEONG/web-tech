import { chromium } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const browser = await chromium.launch({ headless: true })
const paths = process.argv.slice(2).length
    ? process.argv.slice(2)
    : ['/ko/docs/web/javascript-event-loop-runtime', '/ko/docs/web/browser']
if (
    paths.some((path) => !/^\/((ko|en)\/)?docs\/[a-zA-Z0-9/_%-]+$/.test(path))
) {
    await browser.close()
    throw new Error('Pass public docs paths only, without query strings.')
}
const results = []
try {
    for (const profile of ['desktop', 'mobile-lab']) {
        for (const path of paths) {
            for (let run = 1; run <= 3; run++) {
                const context = await browser.newContext({
                    viewport:
                        profile === 'desktop'
                            ? { width: 1280, height: 800 }
                            : { width: 390, height: 844 },
                    isMobile: profile !== 'desktop',
                    hasTouch: profile !== 'desktop',
                    locale: 'ko-KR',
                })
                const page = await context.newPage()
                const errors = []
                page.on('pageerror', (e) =>
                    errors.push(e.message.slice(0, 200))
                )
                page.on('response', (r) => {
                    if (r.status() >= 400)
                        errors.push(`${r.status()} ${r.url().split('?')[0]}`)
                })
                if (profile !== 'desktop') {
                    const cdp = await context.newCDPSession(page)
                    await cdp.send('Network.enable')
                    await cdp.send('Network.emulateNetworkConditions', {
                        offline: false,
                        latency: 150,
                        downloadThroughput: 200000,
                        uploadThroughput: 93750,
                    })
                    await cdp.send('Emulation.setCPUThrottlingRate', {
                        rate: 4,
                    })
                }
                await page.addInitScript(() => {
                    window.__perf = {
                        lcp: null,
                        cls: 0,
                        windowValue: 0,
                        windowStart: 0,
                        lastShift: 0,
                    }
                    new PerformanceObserver((list) => {
                        for (const e of list.getEntries())
                            window.__perf.lcp = {
                                ms: e.startTime,
                                size: e.size,
                                tag: e.element?.tagName,
                                url: e.url,
                                text: e.element?.textContent?.slice(0, 100),
                            }
                    }).observe({
                        type: 'largest-contentful-paint',
                        buffered: true,
                    })
                    new PerformanceObserver((list) => {
                        for (const e of list.getEntries()) {
                            if (e.hadRecentInput) continue
                            const p = window.__perf
                            if (
                                e.startTime - p.lastShift > 1000 ||
                                e.startTime - p.windowStart > 5000
                            ) {
                                p.windowStart = e.startTime
                                p.windowValue = 0
                            }
                            p.windowValue += e.value
                            p.lastShift = e.startTime
                            p.cls = Math.max(p.cls, p.windowValue)
                        }
                    }).observe({ type: 'layout-shift', buffered: true })
                })
                const row = { profile, path, run, at: new Date().toISOString() }
                try {
                    const response = await page.goto(
                        `https://heap-forge.app${path}`,
                        { waitUntil: 'domcontentloaded', timeout: 45000 }
                    )
                    row.status = response.status()
                    row.finalUrl = page.url()
                    const headers = await response.allHeaders()
                    row.headers = Object.fromEntries(
                        [
                            'cache-control',
                            'age',
                            'etag',
                            'x-vercel-cache',
                            'x-vercel-id',
                            'cf-cache-status',
                            'server-timing',
                        ]
                            .filter((k) => headers[k])
                            .map((k) => [k, headers[k]])
                    )
                    await page
                        .locator('.mdx-wrapper')
                        .first()
                        .waitFor({ state: 'visible', timeout: 30000 })
                    row.articleVisibleObservedMs = await page.evaluate(() =>
                        performance.now()
                    )
                    await page
                        .waitForLoadState('load', { timeout: 30000 })
                        .catch(() => {})
                    await page.waitForTimeout(5000)
                    Object.assign(
                        row,
                        await page.evaluate(() => {
                            const n =
                                performance.getEntriesByType('navigation')[0]
                            const p = performance.getEntriesByType('paint')
                            return {
                                navigation: n.toJSON(),
                                ttfbMs: n.responseStart - n.startTime,
                                requestToFirstByteMs:
                                    n.responseStart - n.requestStart,
                                fcpMs: p.find(
                                    (x) => x.name === 'first-contentful-paint'
                                )?.startTime,
                                lcp: window.__perf.lcp,
                                cls: window.__perf.cls,
                                observedUntilMs: performance.now(),
                                title: document.title,
                                articleText:
                                    document.querySelector('.mdx-wrapper')
                                        ?.textContent || '',
                                imageCount: document.images.length,
                                brokenImages: [...document.images]
                                    .filter(
                                        (i) => i.complete && !i.naturalWidth
                                    )
                                    .map((i) => i.currentSrc),
                            }
                        })
                    )
                    row.articleHash = createHash('sha256')
                        .update(row.articleText)
                        .digest('hex')
                    row.articleChars = row.articleText.length
                    delete row.articleText
                } catch (e) {
                    row.error = e.message.slice(0, 350)
                }
                row.errors = errors
                results.push(row)
                console.log(
                    JSON.stringify({
                        profile,
                        path,
                        run,
                        status: row.status,
                        ttfb: row.ttfbMs,
                        lcp: row.lcp?.ms,
                        cls: row.cls,
                        error: row.error,
                        errors,
                    })
                )
                await context.close()
            }
        }
    }
} finally {
    await browser.close()
    await writeFile(
        process.env.PERF_OUTPUT || '/tmp/heap-forge-performance.json',
        JSON.stringify(
            {
                measuredAt: new Date().toISOString(),
                browser: browser.version(),
                conditions:
                    'Fresh browser context per navigation; mobile 150ms latency, 1.6Mbps down, 0.75Mbps up, 4x CPU; LCP candidate observed for 5s after load; CDN/function caches uncontrolled',
                results,
            },
            null,
            2
        )
    )
}

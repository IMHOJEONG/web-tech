const { chromium } = require('@playwright/test')
const fs = require('node:fs')
;(async () => {
    const browser = await chromium.launch()
    const rows = []
    try {
        for (const mobile of process.env.NO_FONTS ? [true] : [false, true])
            for (const slug of ['javascript-event-loop-runtime', 'browser'])
                for (let run = 1; run <= 2; run++) {
                    const ctx = await browser.newContext({
                        viewport: mobile
                            ? { width: 390, height: 844 }
                            : { width: 1280, height: 800 },
                        isMobile: mobile,
                        hasTouch: mobile,
                        locale: 'ko-KR',
                    })
                    if (process.env.NO_FONTS)
                        await ctx.route(/\.woff2(?:\?|$)/, (route) =>
                            route.abort()
                        )
                    const page = await ctx.newPage()
                    const cdp = await ctx.newCDPSession(page)
                    if (mobile) {
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
                        const d = (window.__diag = {
                            shifts: [],
                            lcp: [],
                            tasks: [],
                            fonts: [],
                            body: [],
                        })
                        const name = (n) =>
                            n
                                ? `${n.tagName}#${n.id}.${String(n.className).slice(0, 200)}`
                                : null
                        new PerformanceObserver((l) => {
                            for (const e of l.getEntries())
                                if (!e.hadRecentInput)
                                    d.shifts.push({
                                        at: e.startTime,
                                        value: e.value,
                                        sources: e.sources.map((s) => ({
                                            node: name(s.node),
                                            before: s.previousRect.toJSON(),
                                            after: s.currentRect.toJSON(),
                                        })),
                                    })
                        }).observe({ type: 'layout-shift', buffered: true })
                        new PerformanceObserver((l) => {
                            for (const e of l.getEntries())
                                d.lcp.push({
                                    at: e.startTime,
                                    node: name(e.element),
                                    text: e.element?.textContent?.slice(0, 100),
                                })
                        }).observe({
                            type: 'largest-contentful-paint',
                            buffered: true,
                        })
                        new PerformanceObserver((l) => {
                            for (const e of l.getEntries())
                                d.tasks.push({
                                    at: e.startTime,
                                    duration: e.duration,
                                })
                        }).observe({ type: 'longtask', buffered: true })
                        document.fonts.addEventListener('loadingdone', (e) =>
                            d.fonts.push({
                                at: performance.now(),
                                faces: e.fontfaces.map((f) => ({
                                    family: f.family,
                                    weight: f.weight,
                                    status: f.status,
                                })),
                            })
                        )
                        let prev = ''
                        const timer = setInterval(() => {
                            const n = document.querySelector('.mdx-wrapper')
                            const v = {
                                body: !!n,
                                height: n?.getBoundingClientRect().height,
                                display: n ? getComputedStyle(n).display : null,
                                pending: !!document.querySelector(
                                    '[data-testid="content-pending"]'
                                ),
                            }
                            const s = JSON.stringify(v)
                            if (s !== prev) {
                                d.body.push({ at: performance.now(), ...v })
                                prev = s
                            }
                        }, 50)
                        setTimeout(() => clearInterval(timer), 20000)
                    })
                    await page.goto(
                        'https://heap-forge.app/ko/docs/web/' + slug,
                        { waitUntil: 'load', timeout: 60000 }
                    )
                    await page.waitForTimeout(5000)
                    const data = await page.evaluate(() => ({
                        ...window.__diag,
                        nav: performance
                            .getEntriesByType('navigation')[0]
                            .toJSON(),
                        paint: performance
                            .getEntriesByType('paint')
                            .map((e) => e.toJSON()),
                        resources: performance
                            .getEntriesByType('resource')
                            .map((e) => e.toJSON()),
                        preloads: [
                            ...document.querySelectorAll('link[rel=preload]'),
                        ].map((n) => ({ href: n.href, as: n.as })),
                        font: getComputedStyle(
                            document.querySelector('.mdx-wrapper')
                        ).fontFamily,
                        viewport: {
                            width: innerWidth,
                            height: innerHeight,
                            scale: visualViewport.scale,
                        },
                    }))
                    rows.push({ mobile, slug, run, ...data })
                    console.log(
                        JSON.stringify({
                            mobile,
                            slug,
                            run,
                            shifts: data.shifts,
                            lcp: data.lcp,
                            body: data.body,
                            fonts: data.fonts,
                        })
                    )
                    await ctx.close()
                }
    } finally {
        fs.writeFileSync(
            process.env.TRACE_OUTPUT ||
                (process.env.NO_FONTS
                    ? '/tmp/docs-trace-no-fonts.json'
                    : '/tmp/docs-trace.json'),
            JSON.stringify(rows, null, 2)
        )
        await browser.close()
    }
})()

import { expect, test, type Page } from '@playwright/test'
import type { Server } from 'node:http'
import { setTimeout as wait } from 'node:timers/promises'

import { createLabServer } from '../../../docs/examples/critical-rendering-path-lab/server.ts'

const DELAY_MS = 240
const TIMESTAMP_TOLERANCE_MS = 1

type ResourceTimingSnapshot = {
    responseEnd: number
    startTime: number
    serverTiming: Array<{
        duration: number
        name: string
    }>
}

let baseUrl = ''
let server: Server

test.beforeAll(async () => {
    server = createLabServer()

    await new Promise<void>((resolve, reject) => {
        const handleError = (error: Error) => reject(error)

        server.once('error', handleError)
        server.listen(0, '127.0.0.1', () => {
            server.off('error', handleError)
            resolve()
        })
    })

    const address = server.address()

    if (!address || typeof address === 'string') {
        throw new Error('CRP lab server did not expose a TCP port.')
    }

    baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
    })
})

async function readResourceTiming(
    page: Page,
    pathname: string
): Promise<ResourceTimingSnapshot | null> {
    return page.evaluate((expectedPathname) => {
        const resource = performance
            .getEntriesByType('resource')
            .find((entry) => new URL(entry.name).pathname === expectedPathname)

        if (!resource) {
            return null
        }

        const timing = resource as PerformanceResourceTiming

        return {
            responseEnd: timing.responseEnd,
            startTime: timing.startTime,
            serverTiming: timing.serverTiming.map((entry) => ({
                duration: entry.duration,
                name: entry.name,
            })),
        }
    }, pathname)
}

async function requireResourceTiming(page: Page, pathname: string) {
    await expect
        .poll(async () => (await readResourceTiming(page, pathname)) !== null)
        .toBe(true)

    const timing = await readResourceTiming(page, pathname)

    if (!timing) {
        throw new Error(`Missing resource timing for ${pathname}.`)
    }

    return timing
}

function readInjectedDelay(timing: ResourceTimingSnapshot) {
    return timing.serverTiming.find((entry) => entry.name === 'injected-delay')
        ?.duration
}

async function readLateHeroTiming(page: Page) {
    await expect(page.locator('img.hero')).toBeVisible()
    const hero = await requireResourceTiming(page, '/assets/hero.svg')
    const script = await requireResourceTiming(page, '/assets/late-lcp.js')
    const marks = await page.evaluate(() => ({
        scheduled:
            performance.getEntriesByName('late-lcp-scheduled')[0]?.startTime,
        discovered: performance.getEntriesByName('late-lcp-discovered')[0]
            ?.startTime,
    }))

    if (marks.scheduled === undefined || marks.discovered === undefined) {
        throw new Error('Missing late LCP discovery marks.')
    }

    return {
        hero,
        script,
        scheduled: marks.scheduled,
        discovered: marks.discovered,
    }
}

function expectDelayedHero(
    timing: Awaited<ReturnType<typeof readLateHeroTiming>>
) {
    expect(timing.scheduled).toBeGreaterThanOrEqual(timing.script.responseEnd)
    // All timestamps belong to one navigation; allow only timestamp precision noise.
    expect(timing.discovered - timing.scheduled).toBeGreaterThanOrEqual(
        DELAY_MS - TIMESTAMP_TOLERANCE_MS
    )
    expect(timing.hero.startTime).toBeGreaterThanOrEqual(timing.discovered)
}

test('slow CSS finishes before the first contentful paint', async ({
    page,
}) => {
    await page.goto(`${baseUrl}/slow-css?delay=${DELAY_MS}`, {
        waitUntil: 'load',
    })

    const cssTiming = await requireResourceTiming(page, '/assets/styles.css')

    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    performance.getEntriesByName('first-contentful-paint')[0]
                        ?.startTime ?? null
            )
        )
        .not.toBeNull()

    const firstContentfulPaint = await page.evaluate(
        () =>
            performance.getEntriesByName('first-contentful-paint')[0]
                ?.startTime ?? 0
    )

    expect(readInjectedDelay(cssTiming)).toBe(DELAY_MS)
    expect(firstContentfulPaint).toBeGreaterThanOrEqual(cssTiming.responseEnd)
})

test('a parser-blocking script executes before DOMContentLoaded', async ({
    page,
}) => {
    await page.goto(`${baseUrl}/blocking-script?delay=${DELAY_MS}`, {
        waitUntil: 'load',
    })

    const scriptTiming = await requireResourceTiming(
        page,
        '/assets/blocking.js'
    )
    const milestones = await page.evaluate(() => {
        const navigation = performance.getEntriesByType(
            'navigation'
        )[0] as PerformanceNavigationTiming

        return {
            domContentLoaded: navigation.domContentLoadedEventStart,
            scriptExecuted:
                performance.getEntriesByName('blocking-script-executed')[0]
                    ?.startTime ?? 0,
        }
    })

    expect(readInjectedDelay(scriptTiming)).toBe(DELAY_MS)
    expect(milestones.scriptExecuted).toBeGreaterThanOrEqual(
        scriptTiming.responseEnd
    )
    expect(milestones.domContentLoaded).toBeGreaterThanOrEqual(
        milestones.scriptExecuted
    )
    await expect(page.locator('html')).toHaveAttribute(
        'data-blocking-script',
        'executed'
    )
})

for (const baselineDelayMs of [0, 500]) {
    test(`late LCP discovery waits before requesting the hero (baseline delay ${baselineDelayMs}ms)`, async ({
        page,
    }, testInfo) => {
        await page.route('**/baseline?*', async (route) => {
            const response = await route.fetch()
            await wait(baselineDelayMs)
            await route.fulfill({ response })
        })
        await page.goto(`${baseUrl}/baseline?delay=${DELAY_MS}`, {
            waitUntil: 'load',
        })
        const baselineHero = await requireResourceTiming(
            page,
            '/assets/hero.svg'
        )
        await expect(page.locator('img.hero')).toHaveAttribute(
            'src',
            '/assets/hero.svg'
        )
        await expect(page.locator('#hero-slot')).toHaveCount(0)

        await page.goto(`${baseUrl}/late-lcp?delay=${DELAY_MS}`, {
            waitUntil: 'load',
        })
        const late = await readLateHeroTiming(page)

        await testInfo.attach('late-lcp-timing', {
            contentType: 'application/json',
            body: JSON.stringify({
                baselineDelayMs,
                baselineHero,
                late,
                oldCrossNavigationDifferenceMs:
                    late.hero.startTime - baselineHero.startTime,
            }),
        })
        expectDelayedHero(late)
    })
}

test('the late LCP assertion rejects a fixture with its delay removed', async ({
    page,
}) => {
    await page.route('**/assets/late-lcp.js', async (route) => {
        const response = await route.fetch()
        const source = await response.text()
        expect(source.match(/}, delayMs\);/g)).toHaveLength(1)
        await route.fulfill({
            response,
            body: source.replace('}, delayMs);', '}, 0);'),
        })
    })
    await page.goto(`${baseUrl}/late-lcp?delay=${DELAY_MS}`, {
        waitUntil: 'load',
    })

    const timing = await readLateHeroTiming(page)
    expect(timing.scheduled).toBeGreaterThanOrEqual(timing.script.responseEnd)
    expect(timing.hero.startTime).toBeGreaterThanOrEqual(timing.discovered)
    expect(timing.discovered - timing.scheduled).toBeLessThan(
        DELAY_MS - TIMESTAMP_TOLERANCE_MS
    )
    expect(() => expectDelayedHero(timing)).toThrow()
})

import { createServer, type ServerResponse } from 'node:http'
import { expect, test } from '@playwright/test'
import { observeNavigation } from './navigation-observer'

async function createFixture() {
    let stream: ServerResponse | undefined
    const server = createServer((request, response) => {
        const path = new URL(request.url ?? '/', 'http://fixture').pathname
        if (path === '/abort') return request.socket.destroy()
        if (path === '/failed') {
            response.writeHead(503)
            return response.end('controlled failure')
        }
        if (path === '/stream') {
            stream = response
            response.writeHead(200, { 'Content-Type': 'text/plain' })
            response.write('fixture content not for metadata\n')
            return
        }
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(
            '<!doctype html><html><body><main>Fixture</main></body></html>'
        )
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string')
        throw new Error('No fixture address')
    return {
        origin: `http://127.0.0.1:${address.port}`,
        release: () => stream?.end('fixture complete'),
        close: async () => {
            server.closeAllConnections()
            await new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve()))
            )
        },
    }
}

let fixture: Awaited<ReturnType<typeof createFixture>>
test.beforeEach(async ({ page }) => {
    fixture = await createFixture()
    await page.goto(fixture.origin)
})
test.afterEach(async () => fixture.close())

test('records rapid progress changes and removes observation listeners', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/failed', fixture.origin)
    )
    await page.evaluate(() => {
        const root = document.documentElement
        root.classList.add('nprogress-busy')
        root.removeAttribute('class')
        root.classList.add('unrelated')
    })
    const report = await observation.stop()
    expect(report.nprogress.status).toBe('observed')
    if (report.nprogress.status !== 'observed')
        throw new Error('No progress samples')
    expect(report.nprogress.samples.map(({ busy }) => busy)).toEqual([
        false,
        true,
        false,
        false,
    ])
    expect(report.nprogress.samples.map(({ event }) => event)).toEqual([
        'initial',
        'change',
        'change',
        'final',
    ])
    await page.evaluate(
        async (url) => (await fetch(url)).text(),
        `${fixture.origin}/failed`
    )
    expect(observation.events).toEqual([])
    expect(
        await page.evaluate(() =>
            Object.keys(window).filter((key) =>
                key.startsWith('__offlineProgress_')
            )
        )
    ).toEqual([])
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

test('distinguishes response headers from body completion without recording content', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/stream', fixture.origin)
    )
    const download = page.evaluate(
        async (url) =>
            (
                await fetch(url, {
                    headers: {
                        RSC: '1',
                        'Next-Router-Prefetch': '1',
                        'X-Fixture-Private': 'not-for-metadata',
                    },
                })
            ).text(),
        `${fixture.origin}/stream?private=not-for-metadata`
    )
    try {
        await expect
            .poll(
                () =>
                    observation.events.filter(
                        ({ event }) => event === 'response-headers'
                    ).length
            )
            .toBe(1)
        expect(
            observation.events.some(
                ({ event }) => event === 'response-finished'
            )
        ).toBe(false)
    } finally {
        fixture.release()
    }
    await download
    await expect
        .poll(
            () =>
                observation.events.filter(
                    ({ event }) => event === 'response-finished'
                ).length
        )
        .toBe(1)
    const report = await observation.stop()
    expect(report.events.map(({ event }) => event)).toEqual([
        'request',
        'response-headers',
        'response-finished',
    ])
    expect(report.events.map(({ requestId }) => requestId)).toEqual([1, 1, 1])
    expect(report.events.every(({ rsc, prefetch }) => rsc && prefetch)).toBe(
        true
    )
    expect(report.events[1]?.status).toBe(200)
    expect(report.pendingRequestIds).toEqual([])
    expect(JSON.stringify(report)).not.toMatch(
        /not-for-metadata|fixture content|private=|X-Fixture-Private/
    )
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

test('HTTP errors can finish downloading without becoming successful navigation', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/failed', fixture.origin)
    )
    await page.evaluate(
        async (url) => (await fetch(url)).text(),
        `${fixture.origin}/failed`
    )
    await expect
        .poll(() =>
            observation.events.some(
                ({ event }) => event === 'response-finished'
            )
        )
        .toBe(true)
    const report = await observation.stop()
    expect(observation.failedResponses).toEqual([503])
    expect(
        report.events.find(({ event }) => event === 'response-headers')?.status
    ).toBe(503)
    expect(report.events.some(({ event }) => event === 'request-failed')).toBe(
        false
    )
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

test('network failure is recorded without a fabricated completion', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/abort', fixture.origin)
    )
    await page.evaluate(
        (url) =>
            fetch(url).then(
                () => true,
                () => false
            ),
        `${fixture.origin}/abort`
    )
    await expect
        .poll(() =>
            observation.events.some(({ event }) => event === 'request-failed')
        )
        .toBe(true)
    const report = await observation.stop()
    expect(
        report.events.some(({ event }) => event === 'response-finished')
    ).toBe(false)
    expect(report.pendingRequestIds).toEqual([])
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

test('ending observation reports a pending stream instead of waiting for it', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/stream', fixture.origin)
    )
    const download = page.evaluate(
        async (url) => (await fetch(url)).text(),
        `${fixture.origin}/stream`
    )
    let report
    try {
        await expect
            .poll(() =>
                observation.events.some(
                    ({ event }) => event === 'response-headers'
                )
            )
            .toBe(true)
        report = await observation.stop()
    } finally {
        fixture.release()
        await download
    }
    expect(report.pendingRequestIds).toEqual([1])
    expect(
        report.events.some(({ event }) => event === 'response-finished')
    ).toBe(false)
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

test('document replacement is explicit rather than a fake progress sample', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/next', fixture.origin)
    )
    await page.goto(`${fixture.origin}/next`)
    const report = await observation.stop()
    expect(observation.documentRequests).toEqual(['/next'])
    expect(report.nprogress.status).toBe('unavailable')
    await info.attach('observer-regression', {
        body: JSON.stringify(report),
        contentType: 'application/json',
    })
})

import { createServer, type ServerResponse } from 'node:http'
import { expect, test } from '@playwright/test'
import { observeNavigation } from './navigation-observer'
import { openArticleFromCard } from './article-navigation'

async function createFixture() {
    let stream: ServerResponse | undefined
    const server = createServer((request, response) => {
        const path = new URL(request.url ?? '/', 'http://fixture').pathname
        if (path === '/abort') return request.socket.destroy()
        if (path === '/failed') {
            response.writeHead(503)
            return response.end('controlled failure')
        }
        if (path === '/stream' || path === '/ko/docs/stream') {
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
        abort: () => stream?.destroy(),
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

for (const state of ['loading', 'empty']) {
    test(`a visible ${state} article wrapper is not body completion`, async ({
        page,
    }, info) => {
        await page.setContent('<a href="/ko/docs/body-fixture">Article</a>')
        await page.evaluate((state) => {
            document.querySelector('a')!.addEventListener('click', (event) => {
                event.preventDefault()
                history.pushState(null, '', '/ko/docs/body-fixture')
                const body = document.createElement('div')
                body.dataset.offlineContent = ''
                body.style.minHeight = '20px'
                body.style.minWidth = '20px'
                if (state === 'loading') {
                    const pending = document.createElement('div')
                    pending.dataset.offlineLoading = ''
                    pending.textContent = 'Loading'
                    body.append(pending)
                }
                document.body.append(body)
            })
        }, state)
        let settled = false
        const completed = openArticleFromCard(
            page,
            page.getByRole('link'),
            info
        ).then(
            () => {
                settled = true
                return { error: undefined }
            },
            (error: unknown) => {
                settled = true
                return { error }
            }
        )
        try {
            await expect(page).toHaveURL(
                `${fixture.origin}/ko/docs/body-fixture`
            )
            await expect(page.locator('[data-offline-content]')).toBeVisible()
            await expect(
                expect.poll(() => settled, { timeout: 250 }).toBe(true)
            ).rejects.toThrow()
        } finally {
            await page.locator('[data-offline-content]').evaluate((body) => {
                body.textContent = 'Ready article body'
            })
        }
        const result = await completed
        if (result.error) throw result.error
        const attachment = info.attachments.find(
            ({ name }) => name === 'offline-article-navigation'
        )
        expect(attachment?.body).toBeDefined()
        const report = JSON.parse(attachment!.body!.toString())
        expect(report.events.at(-1).event).toBe('body-visible')
    })
}

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

test('article UI can complete while its response stream is still pending', async ({
    page,
}, info) => {
    await page.setContent('<a href="/ko/docs/stream">Article</a>')
    await page.evaluate(() => {
        document
            .querySelector('a')!
            .addEventListener('click', async (event) => {
                event.preventDefault()
                const response = await fetch('/ko/docs/stream', {
                    headers: { RSC: '1' },
                })
                Reflect.set(window, '__fixtureDownload', response.text())
                history.pushState(null, '', '/ko/docs/stream')
                const body = document.createElement('article')
                body.dataset.offlineContent = ''
                body.textContent = 'Ready article body'
                document.body.append(body)
            })
    })
    try {
        await openArticleFromCard(page, page.getByRole('link'), info)
        const attachment = info.attachments.find(
            ({ name }) => name === 'offline-article-navigation'
        )
        expect(attachment?.body).toBeDefined()
        const report = JSON.parse(attachment!.body!.toString())
        expect(report.events.at(-1).event).toBe('body-visible')
        expect(report.pendingRequestIds).toEqual([1])
        expect(
            report.events.find(
                ({ event }: { event: string }) => event === 'response-headers'
            )?.status
        ).toBe(200)
        expect(
            report.events.some(
                ({ event }: { event: string }) =>
                    event === 'response-finished' || event === 'request-failed'
            )
        ).toBe(false)
    } finally {
        fixture.release()
        await page.evaluate(() => Reflect.get(window, '__fixtureDownload'))
    }
})

for (const prefetch of [false, true]) {
    test(`distinguishes response headers from body completion without recording content (${prefetch ? 'prefetch' : 'navigation'})`, async ({
        page,
    }, info) => {
        const observation = await observeNavigation(
            page,
            new URL('/stream', fixture.origin)
        )
        const download = page.evaluate(
            async ({ url, prefetch }) => {
                const headers: Record<string, string> = {
                    RSC: '1',
                    'X-Fixture-Private': 'not-for-metadata',
                }
                if (prefetch) headers['Next-Router-Prefetch'] = '1'
                return (await fetch(url, { headers })).text()
            },
            {
                url: `${fixture.origin}/stream?private=not-for-metadata`,
                prefetch,
            }
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
        expect(report.events.map(({ requestId }) => requestId)).toEqual([
            1, 1, 1,
        ])
        expect(
            report.events.every(
                ({ rsc, prefetch: observedPrefetch }) =>
                    rsc && observedPrefetch === prefetch
            )
        ).toBe(true)
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
}

test('an interrupted RSC body after HTTP 200 is never recorded as completed', async ({
    page,
}, info) => {
    const observation = await observeNavigation(
        page,
        new URL('/stream', fixture.origin)
    )
    const download = page.evaluate(async (url) => {
        try {
            await (await fetch(url, { headers: { RSC: '1' } })).text()
            return true
        } catch {
            return false
        }
    }, `${fixture.origin}/stream`)
    await expect
        .poll(() =>
            observation.events.some(({ event }) => event === 'response-headers')
        )
        .toBe(true)
    fixture.abort()
    expect(await download).toBe(false)
    await expect
        .poll(() =>
            observation.events.some(({ event }) => event === 'request-failed')
        )
        .toBe(true)
    const report = await observation.stop()
    expect(report.events.map(({ event }) => event)).toEqual([
        'request',
        'response-headers',
        'request-failed',
    ])
    expect(report.events.map(({ requestId }) => requestId)).toEqual([1, 1, 1])
    expect(report.events[1]?.status).toBe(200)
    expect(report.pendingRequestIds).toEqual([])
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

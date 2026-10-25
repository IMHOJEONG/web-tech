import { readFile } from 'node:fs/promises'
import { expect, test, type APIRequestContext } from '@playwright/test'

type CauseTrace = {
    requestId: string
    responseFinished: boolean
    omitted: number
    deliveryFailures: number
    events: { sequence: number; event: string; detail: { status?: number } }[]
}
const remotePath = '/ko/docs/web/article-e2e-remote'
async function control(
    request: APIRequestContext,
    mode: 'release' | 'hold' | 'fail-503'
) {
    const response = await request.post(
        `http://127.0.0.1:3112/__test/remote-body/${mode}`,
        {
            headers: { Authorization: 'Bearer article-e2e-only-control' },
        }
    )
    expect(response.status()).toBe(204)
}
async function prepare(request: APIRequestContext) {
    await control(request, 'release')
    // Drain prior origin work before invalidation; a late cache write must not
    // bypass this case's held body or deliberately failed upstream.
    const settled = await request.get(remotePath)
    expect(await settled.text()).toContain(
        'The remote article has finished rendering.'
    )
    const invalidated = await request.post('/api/revalidate/content', {
        headers: { Authorization: 'Bearer article-e2e-only-revalidation' },
    })
    expect(invalidated.status()).toBe(200)
}
async function summary(id: string): Promise<CauseTrace> {
    expect(id).toMatch(/^[\da-f-]{36}$/i)
    return JSON.parse(
        await readFile(`test-results/request-cause/${id}.json`, 'utf8')
    )
}

// Use the browser's real RSC/router headers. Bare synthetic RSC requests may
// complete with only a shell and never reach the held article body.
for (const ending of ['complete', 'client-abort', 'server-destroy'] as const) {
    test(`request cause control: ${ending}`, async ({
        page,
        request,
    }, testInfo) => {
        await prepare(request)
        await control(request, 'hold')
        let dispatched = false
        await page.route('**/*', async (route) => {
            const headers = route.request().headers()
            const prefetch =
                headers['next-router-prefetch'] === '1' ||
                'next-router-segment-prefetch' in headers
            const target =
                new URL(route.request().url()).pathname === remotePath
            if (prefetch && (!target || dispatched)) {
                await route.fulfill({ status: 204 })
            } else if (prefetch && target) {
                dispatched = true
                await route.continue({
                    headers: {
                        ...headers,
                        'x-article-cause-probe': '1',
                        ...(ending === 'server-destroy'
                            ? { 'x-article-cause-fault': 'response-destroy' }
                            : {}),
                    },
                })
            } else await route.continue()
        })
        try {
            const prefetched = page.waitForResponse(
                (response) =>
                    new URL(response.url()).pathname === remotePath &&
                    response.request().headers()['next-router-prefetch'] === '1'
            )
            await page.goto('/ko/docs/web/article-e2e-publication')
            const response = await prefetched
            expect(response.status()).toBe(200)
            const id = response.headers()['x-article-request-id']!
            expect((await summary(id)).responseFinished).toBe(false)
            if (ending === 'complete') await control(request, 'release')
            if (ending === 'client-abort') await page.goto('/ko/docs')
            await expect
                .poll(async () =>
                    (await summary(id)).events.some(
                        (event) =>
                            event.event ===
                            (ending === 'complete'
                                ? 'response-finish'
                                : 'response-close')
                    )
                )
                .toBe(true)
            const result = await summary(id)
            expect(result.omitted).toBe(0)
            expect(result.deliveryFailures).toBe(0)
            const names = result.events.map((event) => event.event)
            const position = (name: string) => names.indexOf(name)
            expect(result.responseFinished).toBe(ending === 'complete')
            if (ending === 'complete') {
                expect(names).not.toContain('framework-stream-error')
            } else {
                expect(position('response-close')).toBeGreaterThan(-1)
                // Patched Next need not log an error for a closed destination.
                if (names.includes('framework-stream-error'))
                    expect(position('response-close')).toBeLessThan(
                        position('framework-stream-error')
                    )
                if (ending === 'client-abort') {
                    expect(position('socket-end')).toBeGreaterThan(-1)
                    expect(position('socket-end')).toBeLessThan(
                        position('socket-destroy-call')
                    )
                    expect(
                        names.slice(0, position('socket-end'))
                    ).not.toContain('socket-end-call')
                    expect(names).not.toContain('response-destroy-call')
                } else {
                    expect(
                        position('controlled-server-destroy')
                    ).toBeGreaterThan(-1)
                    expect(position('controlled-server-destroy')).toBeLessThan(
                        position('response-destroy-call')
                    )
                    expect(position('response-destroy-call')).toBeLessThan(
                        position('response-close')
                    )
                    expect(
                        names.slice(0, position('response-destroy-call'))
                    ).not.toContain('socket-end')
                }
            }
            await testInfo.attach('request-cause', {
                body: JSON.stringify({ ending, ...result }, null, 2),
                contentType: 'application/json',
            })
        } finally {
            await control(request, 'release')
        }
    })
}

test('request cause control: upstream-503 without navigation', async ({
    request,
}, testInfo) => {
    await prepare(request)
    await control(request, 'fail-503')
    try {
        // A complete HTML response can carry a render failure after headers.
        // HTTP status/finish alone must not be equated with a successful article.
        const response = await request.get(remotePath, {
            headers: { 'x-article-cause-probe': '1' },
        })
        const result = await summary(
            response.headers()['x-article-request-id']!
        )
        expect(result.omitted).toBe(0)
        expect(result.deliveryFailures).toBe(0)
        expect(result.responseFinished).toBe(true)
        expect(
            result.events.some(
                (event) =>
                    event.event === 'upstream-headers' &&
                    event.detail.status === 503
            )
        ).toBe(true)
        const names = result.events.map((event) => event.event)
        expect(names).toContain('console-warning')
        expect(names).toContain('console-error')
        expect(names).not.toContain('framework-stream-error')
        expect(await response.text()).not.toContain(
            'The remote article has finished rendering.'
        )
        await testInfo.attach('request-cause', {
            body: JSON.stringify(
                { ending: 'upstream-503', ...result },
                null,
                2
            ),
            contentType: 'application/json',
        })
    } finally {
        await control(request, 'release')
    }
})

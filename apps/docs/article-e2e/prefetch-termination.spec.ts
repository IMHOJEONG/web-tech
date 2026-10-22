import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { LifecycleSummary } from './request-lifecycle.ts'

// Direct URL interruption control, not a simulated user Link click.
// Only the loopback content fixture can hold a body; no operational API is used.
for (const ending of [
    'navigate-pending',
    'finish-before-navigation',
] as const) {
    test(`prefetch direct URL interruption control: ${ending}`, async ({
        page,
        request,
    }, testInfo) => {
        const control = async (state: 'hold' | 'release') => {
            const response = await request.post(
                `http://127.0.0.1:3112/__test/remote-body/${state}`,
                {
                    headers: {
                        Authorization: 'Bearer article-e2e-only-control',
                    },
                }
            )
            expect(response.status()).toBe(204)
        }
        // Settle a previous aborted request's origin fetch before invalidating.
        // A late cache write must not bypass the next test's held-body condition.
        await control('release')
        const settled = await request.get('/ko/docs/web/article-e2e-remote')
        expect(settled.status()).toBe(200)
        expect(await settled.text()).toContain(
            'The remote article has finished rendering.'
        )
        const invalidated = await request.post('/api/revalidate/content', {
            headers: { Authorization: 'Bearer article-e2e-only-revalidation' },
        })
        expect(invalidated.status()).toBe(200)
        await control('hold')
        let dispatched = false
        await page.route('**/*', async (route) => {
            const headers = route.request().headers()
            const prefetch =
                headers['next-router-prefetch'] === '1' ||
                'next-router-segment-prefetch' in headers
            const target =
                new URL(route.request().url()).pathname ===
                '/ko/docs/web/article-e2e-remote'
            if (prefetch && (!target || dispatched)) {
                await route.fulfill({ status: 204 })
            } else if (prefetch && target) {
                dispatched = true
                await route.continue({
                    headers: { ...headers, 'x-article-lifecycle-probe': '1' },
                })
            } else {
                await route.continue()
            }
        })
        try {
            const prefetched = page.waitForResponse(
                (response) =>
                    new URL(response.url()).pathname ===
                        '/ko/docs/web/article-e2e-remote' &&
                    response.request().headers()['next-router-prefetch'] === '1'
            )
            await page.goto('/ko/docs/web/article-e2e-publication')
            const response = await prefetched
            expect(response.status()).toBe(200)
            const id = response.headers()['x-article-request-id']
            expect(id).toMatch(/^[\da-f-]{36}$/i)
            const summary = async (): Promise<LifecycleSummary> =>
                JSON.parse(
                    await readFile(
                        `test-results/request-lifecycle/${id}.json`,
                        'utf8'
                    )
                )
            expect((await summary()).responseFinished).not.toBe(true)
            if (ending === 'finish-before-navigation') {
                await control('release')
                // Navigation can discard Chromium terminal events. Observe the
                // server finish directly; do not claim browser consumption.
                await expect
                    .poll(async () => (await summary()).responseFinished)
                    .toBe(true)
            }
            await page.goto('/ko/docs')
            await expect(page.getByRole('main')).toBeVisible()
            await expect
                .poll(async () => {
                    const result = await summary()
                    return ending === 'navigate-pending'
                        ? result.events.some(
                              (event) => event.errorCategory === 'stream'
                          )
                        : result.responseFinished
                })
                .toBe(true)
            const result = await summary()
            expect(result.closeBeforeFinish).toBe(ending === 'navigate-pending')
            expect(result.responseFinished).toBe(ending !== 'navigate-pending')
            // Partial instrumentation must not silently reclassify it as harmless.
            expect(result.outcome).toBe(
                ending === 'navigate-pending' ? 'unknown' : 'completed'
            )
            await testInfo.attach('prefetch-termination', {
                body: JSON.stringify({ ending, ...result }, null, 2),
                contentType: 'application/json',
            })
        } finally {
            await control('release')
        }
    })
}

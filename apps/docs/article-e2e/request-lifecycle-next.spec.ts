import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import type { LifecycleSummary } from './request-lifecycle.ts'

async function readSummary(id: string): Promise<LifecycleSummary | null> {
    if (!/^[a-f0-9-]{36}$/.test(id)) return null
    try {
        return JSON.parse(
            await readFile(
                path.resolve('test-results/request-lifecycle', `${id}.json`),
                'utf8'
            )
        ) as LifecycleSummary
    } catch {
        return null
    }
}

test('Next lifecycle: document reload and concurrent RSC requests have distinct IDs', async ({
    page,
    request,
}, testInfo) => {
    await page.setExtraHTTPHeaders({ 'x-article-lifecycle-probe': '1' })
    const article = '/ko/docs/web/javascript-event-loop-runtime'
    const responses = []
    for (let index = 0; index < 2; index++) {
        const response =
            index === 0 ? await page.goto(article) : await page.reload()
        expect(response).not.toBeNull()
        await expect(
            page
                .locator('.mdx-wrapper')
                .getByText('MDN: queueMicrotask와 microtask 처리', {
                    exact: true,
                })
        ).toBeVisible()
        await expect(page.getByTestId('article-supplementary')).toHaveCount(1)
        expect(await response!.finished()).toBeNull()
        responses.push(response!.headers()['x-article-request-id']!)
    }
    const prefetched = await Promise.all(
        [0, 1].map(() =>
            request.get(article, {
                headers: {
                    'x-article-lifecycle-probe': '1',
                    rsc: '1',
                    'next-router-prefetch': '1',
                },
            })
        )
    )
    for (const response of prefetched) {
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('text/x-component')
        responses.push(response.headers()['x-article-request-id']!)
    }
    expect(new Set(responses).size).toBe(4)
    const summaries: LifecycleSummary[] = []
    for (const [index, id] of responses.entries()) {
        await expect
            .poll(async () => (await readSummary(id))?.responseClosed)
            .toBe(true)
        const summary = (await readSummary(id))!
        expect(summary.requestId).toBe(id)
        expect(summary.outcome).toBe('completed')
        expect(summary.errorCoverage).toBe('partial')
        expect(summary.prefetch).toBe(index >= 2)
        expect(summary.requestKind).toBe(index >= 2 ? 'rsc' : 'document')
        expect(summary.closeBeforeFinish).toBe(false)
        expect(summary.durationMs).toBeGreaterThanOrEqual(0)
        summaries.push(summary)
    }
    await testInfo.attach('request-lifecycle', {
        body: JSON.stringify(summaries, null, 2),
        contentType: 'application/json',
    })
})

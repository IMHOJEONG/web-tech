import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
    expect,
    test,
    type APIRequestContext,
    type TestInfo,
} from '@playwright/test'
import { z } from 'zod'

const countsSchema = z.object({
    uniqueFiles: z.number().int().positive(),
    totalReads: z.number().int().positive(),
    maxReadsPerFile: z.number().int().positive(),
    directoryReads: z.number().int().positive(),
})

const routes = [
    '/docs/web/javascript-event-loop-runtime',
    '/docs/category/fe/react/server-client-component-boundary',
    '/docs/web/article-e2e-remote',
]

async function expectSingleRead(
    request: APIRequestContext,
    testInfo: TestInfo,
    route: string,
    label: string
) {
    const id = randomUUID()
    const response = await request.get(route, {
        headers: { 'x-article-io-probe': id },
    })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(
        'data-testid="article-supplementary"'
    )
    const file = path.resolve('test-results/local-io', `${id}.json`)
    await expect
        .poll(async () => readFile(file, 'utf8').catch(() => ''))
        .not.toBe('')
    const evidence = await readFile(file, 'utf8')
    await testInfo.attach(label, {
        body: evidence,
        contentType: 'application/json',
    })
    const counts = countsSchema.parse(JSON.parse(evidence))
    expect(counts.maxReadsPerFile).toBe(1)
    expect(counts.totalReads).toBe(counts.uniqueFiles)
    return counts
}

for (const locale of ['ko', 'en']) {
    for (const route of routes) {
        test(`${locale}${route}: reads once per file, again on the next request`, async ({
            request,
        }, testInfo) => {
            const first = await expectSingleRead(
                request,
                testInfo,
                `/${locale}${route}`,
                'first-request'
            )
            const second = await expectSingleRead(
                request,
                testInfo,
                `/${locale}${route}`,
                'second-request'
            )
            expect(second).toEqual(first)
        })
    }
}

test('concurrent renders have isolated local read counters', async ({
    request,
}, testInfo) => {
    const counts = await Promise.all(
        routes.map((route, index) =>
            expectSingleRead(
                request,
                testInfo,
                `/ko${route}`,
                `concurrent-${index}`
            )
        )
    )
    for (const count of counts) expect(count).toEqual(counts[0])
})

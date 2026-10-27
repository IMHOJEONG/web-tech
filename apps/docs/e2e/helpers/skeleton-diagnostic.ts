import { expect, test as base } from '@playwright/test'
import { captureSkeletonFonts } from './skeleton-snapshot'

export { expect }
export const test = base.extend({
    page: async ({ page }, run, testInfo) => {
        captureSkeletonFonts(page)
        const events: string[] = []
        page.on('console', (message) => {
            if (/refresh|hmr|hydration/i.test(message.text()))
                events.push(message.text())
        })
        page.on('framenavigated', (frame) => {
            if (frame === page.mainFrame())
                events.push(`navigation ${frame.url()}`)
        })
        const cpuRate = Number(process.env.DOCS_SKELETON_CPU_RATE ?? '1')
        if (!Number.isFinite(cpuRate) || cpuRate < 1)
            throw new Error('Invalid skeleton CPU rate')
        const session = await page.context().newCDPSession(page)
        await session.send('Emulation.setCPUThrottlingRate', { rate: cpuRate })
        await page.addInitScript(() => {
            const records: unknown[] = []
            Object.assign(window, { skeletonDiagnostic: records })
            new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.removedNodes) {
                        if (
                            node instanceof Element &&
                            (node.matches('[data-page-pending]') ||
                                node.querySelector('[data-page-pending]'))
                        ) {
                            records.push({
                                kind: 'removed',
                                time: performance.now(),
                                tag: node.tagName,
                                domain: node.getAttribute('data-page-pending'),
                            })
                        }
                    }
                }
            }).observe(document, { childList: true, subtree: true })
        })
        await run(page)
        const state = await page
            .evaluate(() => ({
                pending: document.querySelectorAll('[data-page-pending]')
                    .length,
                main: Boolean(document.querySelector('main')),
                records: (
                    window as unknown as { skeletonDiagnostic: unknown[] }
                ).skeletonDiagnostic,
            }))
            .catch(() => null)
        await testInfo.attach('runtime-diagnostic', {
            body: JSON.stringify({ cpuRate, events, state }),
            contentType: 'application/json',
        })
        await session.detach()
    },
})

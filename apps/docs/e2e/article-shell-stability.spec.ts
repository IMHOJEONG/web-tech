import { expect, test } from '@playwright/test'

for (const path of [
    '/ko/docs/web/javascript-event-loop-runtime',
    '/ko/category/fe/react/server-client-component-boundary',
]) {
    test(`article shell reserves header and footer space: ${path}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await page.addInitScript(() => {
            const samples: {
                header: number
                footer: number
                viewport: number
            }[] = []
            Object.assign(window, { articleShellSamples: samples })
            const timer = window.setInterval(() => {
                const header = document.querySelector('header')
                const shell = document.querySelector(
                    '[data-testid="article-page-shell"]'
                )
                const footer = document.querySelector('footer')
                if (
                    !shell ||
                    !footer ||
                    !performance.getEntriesByName('first-contentful-paint')
                        .length
                )
                    return
                if (!shell.getBoundingClientRect().height) return
                samples.push({
                    header: header?.getBoundingClientRect().height ?? 0,
                    footer: footer.getBoundingClientRect().top,
                    viewport: window.innerHeight,
                })
            }, 16)
            window.setTimeout(() => clearInterval(timer), 20000)
        })
        await page.goto(path)
        await expect(page.locator('.mdx-wrapper')).toBeVisible()
        await expect(page.locator('header')).toHaveCSS('height', '65px')
        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        (
                            window as Window & {
                                articleShellSamples?: unknown[]
                            }
                        ).articleShellSamples?.length ?? 0
                )
            )
            .toBeGreaterThan(2)
        const samples = await page.evaluate(
            () =>
                (
                    window as Window & {
                        articleShellSamples?: {
                            header: number
                            footer: number
                            viewport: number
                        }[]
                    }
                ).articleShellSamples ?? []
        )
        for (const sample of samples) {
            expect(sample.header).toBeCloseTo(65, 0)
            expect(sample.footer).toBeGreaterThanOrEqual(sample.viewport - 1)
        }
    })
}

import { expect, test } from '@playwright/test'

const screens = [
    {
        path: '/docs',
        kind: 'docs',
        ready: '[data-testid="docs-index-results"]',
        anchor: '[data-skeleton-anchor="docs-results"]',
    },
    {
        path: '/docs?q=stream&tag=nodejs',
        kind: 'docs',
        ready: '[data-testid="docs-index-results"]',
        anchor: '[data-skeleton-anchor="docs-results"]',
    },
    {
        path: '/docs?section=web&sort=title&tag=react&collection=react-boundaries',
        width: 320,
        kind: 'docs',
        ready: '[data-testid="docs-index-results"]',
        anchor: '[data-skeleton-anchor="docs-results"]',
    },
    {
        path: '/feed',
        kind: 'feed',
        ready: '[data-testid="feed-lead-story"] > div > a',
        anchor: '[data-skeleton-anchor="preview-card"]',
    },
    {
        path: '/web',
        kind: 'web',
        ready: '[data-hub-header]',
        anchor: '[data-hub-header]',
    },
    {
        path: '/mobile',
        kind: 'mobile',
        ready: '[data-hub-header]',
        anchor: '[data-hub-header]',
    },
    {
        path: '/ui-ux',
        kind: 'ui-ux',
        ready: '[data-testid="uiux-featured-articles"]',
        anchor: '[data-skeleton-anchor="preview-card"]',
    },
    {
        path: '/category',
        kind: 'category-index',
        ready: 'main > div > section:nth-child(2)',
        anchor: '[data-skeleton-anchor="category-results"]',
    },
    {
        path: '/category/fe',
        kind: 'category-main',
        ready: 'main > div > section:nth-child(2)',
        anchor: '[data-skeleton-anchor="category-results"]',
    },
    {
        path: '/category/fe/react',
        kind: 'category-sub',
        ready: 'main > div > section:nth-child(2)',
        anchor: '[data-skeleton-anchor="category-results"]',
    },
    {
        path: '/docs/web/javascript-event-loop-runtime',
        kind: 'article',
        ready: 'main',
        anchor: '[data-skeleton-anchor="article-body"]',
    },
] as const

for (const theme of ['light', 'dark'] as const) {
    for (const screen of screens) {
        test(`${theme} ${screen.path}: domain skeleton preserves page geometry`, async ({
            page,
            browser,
        }, testInfo) => {
            const locale =
                testInfo.project.name === 'chromium-tablet' ? 'en' : 'ko'
            const path = `/${locale}${screen.path}`
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            if ('width' in screen)
                await page.setViewportSize({ width: screen.width, height: 844 })
            await page.emulateMedia({
                reducedMotion: 'reduce',
                colorScheme: theme,
            })
            await page.addInitScript(
                (value) => localStorage.setItem('theme', value),
                theme
            )
            const response = await page.request.get(path)
            expect(response.ok()).toBe(true)
            const html = await response.text()
            expect(
                html.includes(`data-page-pending="${screen.kind}"`),
                `server emits ${screen.kind}`
            ).toBe(true)
            await page.goto(path)
            await expect(page.locator('[data-page-pending]')).toHaveCount(0)
            await expect(page.locator(screen.ready).first()).toBeVisible()
            // The theme script can run after streamed content becomes visible.
            if (theme === 'dark') {
                await expect(page.locator('html')).toHaveClass(/\bdark\b/)
            } else {
                await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
            }
            await page.evaluate(() => document.fonts.ready)
            const before = await page.locator('main').evaluate((el) => {
                const box = el.getBoundingClientRect()
                return {
                    left: box.left,
                    width: box.width,
                    top: box.top,
                    titleTop: el.querySelector('h1')?.getBoundingClientRect()
                        .top,
                }
            })
            const readyAnchor = await page
                .locator(screen.ready)
                .first()
                .evaluate((el) => el.getBoundingClientRect().top)
            // Render a detached snapshot so React cannot repair test-only DOM edits.
            const frozenHtml = await page.evaluate(
                ({ html, kind }) => {
                    const parsed = new DOMParser().parseFromString(
                        html,
                        'text/html'
                    )
                    const pending = parsed.querySelector(
                        `[data-page-pending="${kind}"]`
                    )
                    if (!pending)
                        throw new Error(`Missing server skeleton: ${kind}`)
                    const snapshot = new DOMParser().parseFromString(
                        document.documentElement.outerHTML,
                        'text/html'
                    )
                    const main = snapshot.querySelector('main')!
                    const target =
                        kind === 'article' ? main.parentElement! : main
                    target.replaceWith(snapshot.importNode(pending, true))
                    snapshot
                        .querySelectorAll('script')
                        .forEach((s) => s.remove())
                    return (
                        '<!doctype html>' + snapshot.documentElement.outerHTML
                    )
                },
                { html, kind: screen.kind }
            )
            const context = await browser.newContext({
                viewport: page.viewportSize()!,
                colorScheme: theme,
                reducedMotion: 'reduce',
                javaScriptEnabled: false,
            })
            try {
                const frozen = await context.newPage()
                await frozen.route(
                    (url) => url.href === page.url(),
                    (route) =>
                        route.fulfill({
                            contentType: 'text/html',
                            body: frozenHtml,
                        })
                )
                await frozen.goto(page.url())
                await frozen.evaluate(() => document.fonts.ready)
                const pending = frozen.locator(
                    `[data-page-pending="${screen.kind}"]`
                )
                await expect(pending).toBeVisible()
                await expect(pending).toHaveAttribute('aria-busy', 'true')
                await expect(
                    pending.locator(':scope > [role="status"]')
                ).toHaveCount(1)
                await expect(
                    pending.locator(':scope > [role="status"]')
                ).not.toHaveText('')
                const geometry =
                    screen.kind === 'article'
                        ? pending.locator(
                              '[data-skeleton-anchor="article-body"]'
                          )
                        : pending
                const after = await geometry.evaluate((el) => {
                    const box = el.getBoundingClientRect()
                    return {
                        left: box.left,
                        width: box.width,
                        top: box.top,
                        titleTop: el
                            .querySelector('h1')
                            ?.getBoundingClientRect().top,
                        pageWidth: document.documentElement.scrollWidth,
                        viewport: innerWidth,
                        animations: Array.from(el.querySelectorAll('*')).filter(
                            (node) =>
                                getComputedStyle(node).animationName !== 'none'
                        ).length,
                    }
                })
                expect(after.pageWidth).toBeLessThanOrEqual(after.viewport + 1)
                expect(after.animations).toBe(0)
                expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(
                    1
                )
                expect(
                    Math.abs(after.width - before.width)
                ).toBeLessThanOrEqual(1)
                if (
                    after.titleTop !== undefined &&
                    before.titleTop !== undefined
                ) {
                    expect(
                        Math.abs((after.titleTop ?? 0) - before.titleTop)
                    ).toBeLessThanOrEqual(1)
                }
                const pendingAnchor = await pending
                    .locator(screen.anchor)
                    .first()
                    .evaluate((el) => el.getBoundingClientRect().top)
                const delta = Math.round(pendingAnchor - readyAnchor)
                if (
                    screen.kind === 'docs' ||
                    screen.kind === 'ui-ux' ||
                    screen.kind === 'category-index'
                )
                    expect(Math.abs(delta)).toBeLessThanOrEqual(2)
                expect(errors).toEqual([])
                await testInfo.attach('skeleton-layout', {
                    body: JSON.stringify(
                        {
                            path,
                            project: testInfo.project.name,
                            theme,
                            before,
                            after,
                            readyAnchor,
                            pendingAnchor,
                            delta,
                            errors,
                        },
                        null,
                        2
                    ),
                    contentType: 'application/json',
                })
                if (
                    screen.kind === 'docs' ||
                    screen.kind === 'feed' ||
                    screen.kind === 'ui-ux'
                )
                    await frozen.screenshot({
                        path: testInfo.outputPath('pending.png'),
                        caret: 'initial',
                    })
            } finally {
                await context.close()
            }
        })
    }
}

test('landing only suspends latest notes and keeps its introduction visible', async ({
    page,
}) => {
    const response = await page.request.get('/ko')
    const html = await response.text()
    expect(html).toContain('data-page-pending="landing-notes"')
    expect(html.indexOf('<h1')).toBeLessThan(
        html.indexOf('data-page-pending="landing-notes"')
    )
    await page.goto('/ko')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-page-pending]')).toHaveCount(0)
})

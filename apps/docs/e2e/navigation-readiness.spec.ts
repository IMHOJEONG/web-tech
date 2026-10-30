import { expect, test } from '@playwright/test'
import ko from '../shared/message/ko.json' with { type: 'json' }
import { followLink } from './helpers/follow-link'

test('mobile keyboard activation waits for the hydrated drawer trigger', async ({
    page,
    isMobile,
}, testInfo) => {
    test.skip(!isMobile, 'Mobile drawer keyboard contract')
    let releaseScripts = () => {}
    const scriptsReady = new Promise<void>((resolve) => {
        releaseScripts = resolve
    })
    await page.route('**/*', async (route) => {
        if (route.request().resourceType() === 'script') await scriptsReady
        await route.continue()
    })
    try {
        await page.goto('/ko/web', { waitUntil: 'commit' })
        const trigger = page.getByTestId('mobile-nav-drawer-trigger')
        const menu = page.getByRole('navigation', {
            name: '주요 메뉴',
            exact: true,
        })
        await expect(trigger).toBeVisible()
        await expect(trigger).toBeDisabled()
        // Reproduce the old test: press resolves but disabled HTML swallows Enter.
        await trigger.press('Enter')
        await expect(menu).toHaveCount(0)
        releaseScripts()
        await expect(trigger).toBeEnabled()
        await trigger.press('Enter')
        await expect(menu).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(menu).toHaveCount(0)
        await expect(trigger).toBeFocused()
        await testInfo.attach('drawer-readiness', {
            contentType: 'application/json',
            body: JSON.stringify({
                disabledEnterOpensMenu: false,
                hydratedEnterOpensMenu: true,
                escapeRestoresFocus: true,
            }),
        })
    } finally {
        releaseScripts()
        await page.unrouteAll({ behavior: 'wait' })
    }
})

test('category navigation waits for the route response, not the UI assertion deadline', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'chromium-desktop',
        'Desktop route race'
    )
    await page.goto('/ko/category')
    // This component exposes hydration readiness even when hidden on desktop.
    await expect(page.getByTestId('mobile-nav-drawer-trigger')).toBeEnabled()
    let releaseRoute = () => {}
    let routeRequested = () => {}
    const responseReady = new Promise<void>((resolve) => {
        releaseRoute = resolve
    })
    const requested = new Promise<void>((resolve) => {
        routeRequested = resolve
    })
    await page.route(
        (url) => url.pathname === '/ko/category/fe',
        async (route) => {
            if (route.request().headers().rsc === '1') {
                routeRequested()
                await responseReady
            }
            await route.continue()
        }
    )
    const destination = new URL('/ko/category/fe', page.url()).href
    // Observe rejection immediately so a failing navigation cannot be unhandled.
    const navigation = followLink(
        page,
        page.getByRole('main').locator('a[href="/ko/category/fe"]'),
        '/ko/category/fe'
    ).then(
        () => ({ ok: true as const }),
        (error: unknown) => ({ ok: false as const, error })
    )
    try {
        await requested
        expect(page.url()).toBe(new URL('/ko/category', page.url()).href)
        await expect(page.locator('html')).toHaveClass(/nprogress-busy/)
        const started = performance.now()
        // Negative control: the old 5s URL assertion expires while navigation is pending.
        await expect(expect(page).toHaveURL(destination)).rejects.toThrow(
            /toHaveURL/
        )
        const heldMilliseconds = performance.now() - started
        releaseRoute()
        const result = await navigation
        if (!result.ok) throw result.error
        await expect(page).toHaveURL(destination)
        await expect(
            page.getByRole('main').getByRole('heading', { level: 1 })
        ).toHaveText(ko.category.main.title)
        await testInfo.attach('category-route-readiness', {
            contentType: 'application/json',
            body: JSON.stringify({
                rscRequestObserved: true,
                pendingUrlIsPreviousRoute: true,
                oldUrlAssertionExpired: true,
                heldMilliseconds,
                navigationCompleted: true,
            }),
        })
    } finally {
        releaseRoute()
        await navigation
        await page.unrouteAll({ behavior: 'wait' })
    }
})

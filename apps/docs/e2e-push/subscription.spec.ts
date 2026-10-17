import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
    await page.route('**/api/push/access', (route) =>
        route.fulfill({ json: { authorized: true } })
    )
    await page.addInitScript(() => {
        let current: object | null = null
        const subscription = {
            toJSON: () => ({
                endpoint: 'https://fcm.googleapis.com/test',
                keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) },
            }),
            unsubscribe: async () => {
                current = null
                return true
            },
        }
        const registration = {
            pushManager: {
                getSubscription: async () => current,
                subscribe: async () => {
                    current = subscription
                    return subscription
                },
            },
        }
        Object.defineProperty(navigator, 'serviceWorker', {
            value: {
                getRegistration: async () => registration,
                register: async () => registration,
                ready: Promise.resolve(registration),
            },
        })
        Object.defineProperty(Notification, 'permission', {
            get: () => 'default',
            configurable: true,
        })
        Object.defineProperty(Notification, 'requestPermission', {
            value: async () => {
                document.documentElement.dataset.pushPermissionRequested =
                    'true'
                return 'granted'
            },
        })
    })
    await page.route('**/api/push', (route) =>
        route.fulfill({ json: { publicKey: 'B'.repeat(87) } })
    )
})

test('only requests permission on click, subscribes once and unsubscribes', async ({
    page,
}) => {
    const methods: string[] = []
    await page.route('**/api/push/subscriptions', (route) => {
        methods.push(route.request().method())
        return route.fulfill({
            json: { subscribed: route.request().method() === 'POST' },
        })
    })
    await page.goto('/ko/about')
    const panel = page.getByRole('region', {
        name: '이 브라우저에서 알림 받아보기',
    })
    await expect(
        panel.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeEnabled()
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-push-permission-requested'
    )
    expect(methods).toEqual([])
    await panel.getByRole('button', { name: '테스트 알림 받기' }).click()
    await expect(
        panel.getByRole('button', { name: '알림 구독 해지' })
    ).toBeEnabled()
    await panel.getByRole('button', { name: '알림 구독 해지' }).click()
    await expect(
        panel.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeEnabled()
    expect(methods).toEqual(['POST', 'DELETE'])
})

test('failed persistence rolls back the new browser subscription and offers retry', async ({
    page,
}) => {
    await page.route('**/api/push/subscriptions', (route) =>
        route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    )
    await page.goto('/ko/about')
    await page.getByRole('button', { name: '테스트 알림 받기' }).click()
    await expect(
        page
            .getByRole('status')
            .filter({ hasText: '알림 설정을 변경하지 못했습니다' })
    ).toBeVisible()
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeEnabled()
})

test('denied permission does not repeatedly prompt', async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(Notification, 'permission', {
            get: () => 'denied',
            configurable: true,
        })
    })
    await page.goto('/ko/about')
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeDisabled()
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-push-permission-requested'
    )
})

test('BFF rejects foreign origins and cannot expose a send endpoint', async ({
    request,
}) => {
    const forbidden = await request.post('/api/push/subscriptions', {
        headers: { Origin: 'https://evil.example' },
        data: {},
    })
    expect(forbidden.status()).toBe(403)
    const config = await request.get('/api/push')
    expect(config.status()).toBe(401)
    expect(await config.json()).toEqual({ message: 'Unauthorized' })
    const sending = await request.post('/api/push/test', { data: {} })
    expect([404, 405]).toContain(sending.status())
})

test('invitation gate prevents permissions and subscription mutations until explicit unlock', async ({
    page,
}) => {
    let allowed = false
    const mutations: string[] = []
    await page.route('**/api/push/access', (route) => {
        if (route.request().method() === 'POST') {
            allowed = true
        }
        return route.fulfill({ json: { authorized: allowed } })
    })
    await page.route('**/api/push/subscriptions', (route) => {
        mutations.push(route.request().method())
        return route.fulfill({ json: { subscribed: true } })
    })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/ko/about')
    await expect(page.getByLabel('실험 참여 코드')).toBeVisible()
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toHaveCount(0)
    expect(mutations).toEqual([])
    await page.getByLabel('실험 참여 코드').fill('a'.repeat(64))
    await page.getByRole('button', { name: '참여 코드 확인' }).click()
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeEnabled()
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-push-permission-requested'
    )
    expect(mutations).toEqual([])
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth
        )
    ).toBe(false)
})

test('invalid invitation stays locked and clears the password field', async ({
    page,
}) => {
    await page.route('**/api/push/access', (route) =>
        route.fulfill({
            status: route.request().method() === 'POST' ? 401 : 200,
            json: { authorized: false },
        })
    )
    await page.goto('/ko/about')
    await page.getByLabel('실험 참여 코드').fill('d'.repeat(64))
    await page.getByRole('button', { name: '참여 코드 확인' }).click()
    await expect(page.locator('#push-access-error')).toHaveText(
        '참여 코드를 확인해 주세요.'
    )
    await expect(page.getByLabel('실험 참여 코드')).toHaveValue('')
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-push-permission-requested'
    )
})

test('real BFF invitation cookie is HttpOnly and gates both config and mutations', async ({
    request,
    baseURL,
}) => {
    const headers = { Origin: baseURL ?? 'http://127.0.0.1:3017' }
    expect((await request.get('/api/push')).status()).toBe(401)
    expect(
        (
            await request.post('/api/push/subscriptions', { headers, data: {} })
        ).status()
    ).toBe(401)
    const incorrect = await request.post('/api/push/access', {
        headers,
        data: { code: 'd'.repeat(64) },
    })
    expect(incorrect.status()).toBe(401)
    expect(incorrect.headers()['set-cookie']).toBeUndefined()
    const correct = await request.post('/api/push/access', {
        headers,
        data: { code: 'a'.repeat(64) },
    })
    expect(correct.status()).toBe(200)
    const cookie = correct.headers()['set-cookie'] ?? ''
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=strict')
    expect(cookie).toContain('Max-Age=3600')
    expect(cookie).toContain('Path=/api/push')
    expect(cookie).not.toContain('a'.repeat(64))
    // Reaching the absent test backend is different from failing the participant gate.
    expect((await request.get('/api/push')).status()).toBe(503)
    expect(await (await request.get('/api/push/access')).json()).toEqual({
        authorized: true,
    })
    const tampered = await request.get('/api/push', {
        headers: { Cookie: 'heap-forge-push-access=invalid' },
    })
    expect(tampered.status()).toBe(401)
    expect(
        (
            await request.post('/api/push/access', {
                headers: { Origin: 'https://evil.example' },
                data: {},
            })
        ).status()
    ).toBe(403)
})

test('expired access locks unsubscribe without deleting the native subscription', async ({
    page,
}) => {
    const methods: string[] = []
    await page.route('**/api/push/subscriptions', (route) => {
        const method = route.request().method()
        methods.push(method)
        return route.fulfill({
            status: method === 'DELETE' ? 401 : 200,
            json: {},
        })
    })
    await page.goto('/ko/about')
    await page.getByRole('button', { name: '테스트 알림 받기' }).click()
    await page.getByRole('button', { name: '알림 구독 해지' }).click()
    await expect(page.getByLabel('실험 참여 코드')).toBeVisible()
    expect(methods).toEqual(['POST', 'DELETE'])
    expect(
        await page.evaluate(async () =>
            Boolean(
                await (
                    await navigator.serviceWorker.getRegistration('/')
                )?.pushManager.getSubscription()
            )
        )
    ).toBe(true)
})

test('unavailable access cannot request notification permission', async ({
    page,
}) => {
    await page.route('**/api/push/access', (route) =>
        route.fulfill({ status: 503, json: { message: 'Unavailable' } })
    )
    await page.goto('/ko/about')
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeDisabled()
    await expect(page.locator('html')).not.toHaveAttribute(
        'data-push-permission-requested'
    )
})

test('English copy fits a mobile viewport', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en/about')
    const panel = page.getByRole('region', {
        name: 'Try notifications in this browser',
    })
    await expect(
        panel.getByRole('button', { name: 'Subscribe to test notifications' })
    ).toBeEnabled()
    const bounds = await panel.boundingBox()
    expect(bounds?.width).toBeLessThanOrEqual(390)
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
    )
    expect(overflow).toBe(false)
    await panel.screenshot({
        path: testInfo.outputPath('push-panel-mobile.png'),
    })
})

test('unsupported browsers show an explanation instead of a broken button', async ({
    page,
}) => {
    await page.addInitScript(() => {
        Reflect.deleteProperty(window, 'PushManager')
    })
    await page.goto('/ko/about')
    await expect(
        page.getByRole('button', { name: '테스트 알림 받기' })
    ).toBeDisabled()
    await expect(
        page
            .getByRole('status')
            .filter({ hasText: '현재 환경에서는 웹 푸시를 사용할 수 없습니다' })
    ).toBeVisible()
})

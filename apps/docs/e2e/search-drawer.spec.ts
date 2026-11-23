import { expect, test } from '@playwright/test'

const articleHref = '/docs/category/fe/react/server-client-component-boundary'
const result = (query: string) => ({
    query,
    count: 1,
    results: [
        {
            id: 'synthetic-react',
            title: `${query || 'Recent'} document`,
            summary: 'Synthetic search summary',
            href: articleHref,
            section: 'Web',
            readMinutes: 3,
        },
    ],
    suggestions: query ? ['react-query'] : ['React', 'Accessibility'],
})

test('repeated query cycles cannot revive stale result links before the new response', async ({
    page,
}) => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    let firstQueryRequests = 0
    await page.route('**/api/search/suggestions?**', async (route) => {
        const query = new URL(route.request().url()).searchParams.get('q') ?? ''
        if (query === 'React') firstQueryRequests++
        if (
            query === 'pending' ||
            (query === 'React' && firstQueryRequests > 1)
        )
            await gate
        await route.fulfill({ json: result(query) })
    })
    try {
        await page.goto('/ko/about')
        await page.getByTestId('search-drawer-trigger').click()
        const drawer = page.getByRole('dialog')
        const input = drawer.getByRole('searchbox')
        await input.fill('React')
        const links = drawer.getByRole('list').getByRole('link')
        await expect(links).toContainText('React document')
        await input.press('ArrowDown')
        await expect(links.first()).toBeFocused()
        await input.fill('pending')
        await expect(links).toHaveCount(0)
        await input.fill('React')
        await expect(links).toHaveCount(0)
        await input.press('ArrowDown')
        await expect(input).toBeFocused()
        await input.press('Enter')
        await expect(page).toHaveURL('/ko/docs?q=React')
        await expect(drawer).toBeHidden()
    } finally {
        release()
    }
})

for (const locale of ['ko', 'en']) {
    test(`${locale}: tab to a result and back then Enter submits the query`, async ({
        page,
        browserName,
    }) => {
        await page.route('**/api/search/suggestions?**', async (route) => {
            const query =
                new URL(route.request().url()).searchParams.get('q') ?? ''
            await route.fulfill({ json: { ...result(query), suggestions: [] } })
        })
        await page.goto(`/${locale}/about`)
        await page.getByTestId('search-drawer-trigger').click()
        const drawer = page.getByRole('dialog')
        const search = drawer.getByRole('search')
        const input = search.getByRole('searchbox')
        await input.fill('React')
        const clear = search.getByRole('button', {
            name: locale === 'ko' ? '검색어 지우기' : 'Clear search query',
        })
        const submit = search.locator('button[type="submit"]')
        const link = drawer.getByRole('list').getByRole('link')
        await expect(link).toHaveAttribute('href', `/${locale}${articleHref}`)

        // The macOS WebKit runner uses Option-Tab for sequential link focus.
        const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab'
        const back = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab'
        for (const target of [clear, submit, link]) {
            await page.keyboard.press(tab)
            await expect(target).toBeFocused()
        }
        for (const target of [submit, clear, input]) {
            await page.keyboard.press(back)
            await expect(target).toBeFocused()
        }
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(`/${locale}/docs?q=React`)
        await expect(drawer).toBeHidden()
    })

    test(`${locale}: same-query submission closes the drawer without another navigation`, async ({
        page,
    }) => {
        await page.route('**/api/search/suggestions?**', async (route) => {
            const query =
                new URL(route.request().url()).searchParams.get('q') ?? ''
            await route.fulfill({ json: result(query) })
        })
        await page.goto(`/${locale}/docs?q=React`)
        const historyLength = await page.evaluate(() => history.length)
        await page.getByTestId('search-drawer-trigger').click()
        const drawer = page.getByRole('dialog')
        const input = drawer.getByRole('searchbox')
        await expect(input).toHaveValue('React')
        await input.dispatchEvent('compositionstart')
        await input.press('Enter')
        await expect(drawer).toBeVisible()
        await input.dispatchEvent('compositionend')
        await input.press('Enter')
        await expect(drawer).toBeHidden()
        await expect(page).toHaveURL(`/${locale}/docs?q=React`)
        expect(await page.evaluate(() => history.length)).toBe(historyLength)
        await expect(page.getByTestId('search-drawer-trigger')).toBeFocused()
    })
}

test('arrow keys follow focus inside the document list, not only the input', async ({
    page,
}) => {
    await page.route('**/api/search/suggestions?**', async (route) => {
        const data = result(
            new URL(route.request().url()).searchParams.get('q') ?? ''
        )
        await route.fulfill({
            json: {
                ...data,
                count: 2,
                results: [
                    ...data.results,
                    {
                        ...data.results[0],
                        id: 'second-document',
                        title: 'Second document',
                        href: '/docs/web/javascript-event-loop-runtime',
                    },
                ],
            },
        })
    })
    await page.goto('/ko/about')
    await page.getByTestId('search-drawer-trigger').click()
    const drawer = page.getByRole('dialog')
    const input = drawer.getByRole('searchbox')
    const links = drawer.getByRole('list').getByRole('link')
    await expect(links).toHaveCount(2)
    await input.dispatchEvent('keydown', {
        key: 'ArrowDown',
        isComposing: true,
    })
    await expect(input).toBeFocused()
    await input.press('ArrowUp')
    await expect(links.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(links.first()).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(links.nth(1)).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(links.first()).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`/ko${articleHref}$`))
    await expect(page.getByRole('dialog')).toBeHidden()
})

for (const locale of ['ko', 'en']) {
    test(`${locale}: modal autocomplete debounces typing and moves focus to a result link`, async ({
        page,
    }) => {
        const requested: string[] = []
        await page.route('**/api/search/suggestions?**', async (route) => {
            const q = new URL(route.request().url()).searchParams.get('q') ?? ''
            requested.push(q)
            await route.fulfill({ json: result(q) })
        })
        await page.goto(`/${locale}/about`)
        const trigger = page.getByTestId('search-drawer-trigger')
        await trigger.click()
        const drawer = page.getByRole('dialog')
        const input = drawer.getByRole('searchbox')
        await expect(input).toBeFocused()
        const bounds = (await drawer.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(
            Math.min(390, page.viewportSize()!.width) - 1
        )
        await expect
            .poll(async () => {
                const current = (await drawer.boundingBox())!
                return current.x + current.width
            })
            .toBeLessThanOrEqual(page.viewportSize()!.width + 1)
        await expect(drawer.getByRole('list').getByRole('link')).toHaveCount(1)
        requested.length = 0
        await input.fill('r')
        await input.fill('re')
        await input.fill('rea')
        await expect(drawer.getByRole('list').getByRole('link')).toContainText(
            'rea document'
        )
        expect(requested).toEqual(['rea'])
        await expect(page).toHaveURL(new RegExp(`/${locale}/about$`))
        await input.press('ArrowDown')
        await expect(drawer.getByRole('list').getByRole('link')).toBeFocused()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`/${locale}${articleHref}$`))
        await expect(drawer).toBeHidden()
    })
}

test('late results cannot replace the current query; failures have retry and empty states', async ({
    page,
}) => {
    let release!: () => void
    let slowStarted = false
    let fail = true
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    await page.route('**/api/search/suggestions?**', async (route) => {
        const q = new URL(route.request().url()).searchParams.get('q') ?? ''
        if (q === 'slow') {
            slowStarted = true
            await gate
        }
        if (q === 'broken' && fail) {
            await route.fulfill({ status: 503 })
            return
        }
        await route.fulfill({
            json:
                q === 'nothing'
                    ? { query: q, count: 0, results: [], suggestions: [] }
                    : result(q),
        })
    })
    try {
        await page.goto('/ko/about')
        await page.getByTestId('search-drawer-trigger').click()
        const drawer = page.getByRole('dialog')
        const input = drawer.getByRole('searchbox')
        await input.fill('slow')
        await expect.poll(() => slowStarted).toBe(true)
        await input.fill('fast')
        await expect(drawer.getByRole('list').getByRole('link')).toContainText(
            'fast document'
        )
        release()
        await expect(
            drawer.getByRole('list').getByRole('link')
        ).not.toContainText('slow document')
        await input.fill('broken')
        await expect(
            drawer.getByText('검색 결과를 불러오지 못했어요.', { exact: false })
        ).toBeVisible()
        fail = false
        await drawer.getByRole('button', { name: '다시 시도' }).click()
        await expect(drawer.getByRole('list').getByRole('link')).toContainText(
            'broken document'
        )
        await input.fill('nothing')
        await expect(
            drawer.getByText('일치하는 문서가 없어요.', { exact: false })
        ).toBeVisible()
        await expect(drawer.getByRole('list').getByRole('link')).toHaveCount(0)
        await input.press('Escape')
        await expect(drawer).toBeHidden()
        await expect(page.getByTestId('search-drawer-trigger')).toBeFocused()
    } finally {
        release()
    }
})

test('composition pauses suggestions and Escape does not close an active IME session', async ({
    page,
}) => {
    const queries: string[] = []
    await page.route('**/api/search/suggestions?**', async (route) => {
        const q = new URL(route.request().url()).searchParams.get('q') ?? ''
        queries.push(q)
        await route.fulfill({ json: result(q) })
    })
    await page.goto('/ko/about')
    await page.getByTestId('search-drawer-trigger').click()
    const drawer = page.getByRole('dialog')
    const input = drawer.getByRole('searchbox')
    const updateComposition = (value: string) =>
        input.evaluate((element, text) => {
            // Firefox fill() completes its own composition before it returns.
            const setValue = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value'
            )!.set!
            setValue.call(element, text)
            element.dispatchEvent(
                new InputEvent('input', {
                    bubbles: true,
                    isComposing: true,
                    inputType: 'insertCompositionText',
                    data: text,
                })
            )
        }, value)
    await expect(drawer.getByRole('list').getByRole('link')).toHaveCount(1)
    await input.press('ArrowDown')
    await expect(drawer.getByRole('list').getByRole('link')).toBeFocused()
    await input.dispatchEvent('compositionstart')
    await expect(input).toBeFocused()
    await input.dispatchEvent('compositionend')
    await expect(drawer.getByRole('list').getByRole('link')).toHaveCount(1)
    queries.length = 0
    await input.dispatchEvent('compositionstart')
    await updateComposition('가'.repeat(41))
    await input.press('Enter')
    await input.press('Escape')
    await expect(drawer).toBeVisible()
    await expect(page.getByTestId('search-drawer-trigger')).toHaveAttribute(
        'aria-expanded',
        'true'
    )
    await input.dispatchEvent('compositionend')
    await expect(input).toHaveValue('가'.repeat(40))
    await expect.poll(() => queries).toEqual(['가'.repeat(40)])
    await page.setViewportSize({ width: 390, height: 600 })
    await expect(drawer).toBeVisible()
    const bounds = await drawer.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.width).toBeLessThanOrEqual(391)
    await input.dispatchEvent('compositionstart')
    await updateComposition('나'.repeat(41))
    await drawer.getByRole('button', { name: '검색 닫기' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.getByTestId('search-drawer-trigger')).toBeFocused()
    await page.getByTestId('search-drawer-trigger').click()
    await expect(input).toHaveValue('나'.repeat(40))
    await expect(drawer.getByRole('list').getByRole('link')).toHaveCount(1)
})

test('suggestion endpoint is bounded and uses the first normalized query', async ({
    request,
}) => {
    const response = await request.get('/api/search/suggestions?q=&q=ignored')
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toBe('no-store')
    const data = await response.json()
    expect(data.query).toBe('')
    expect(data.results.length).toBeLessThanOrEqual(8)
    expect(data.count).toBeGreaterThanOrEqual(data.results.length)
    for (const item of data.results) {
        expect(item).not.toHaveProperty('content')
        expect(item).not.toHaveProperty('preview')
    }
})

for (const theme of ['light', 'dark']) {
    test(`${theme}: real local suggestions remain readable and inside the viewport`, async ({
        page,
    }, testInfo) => {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.goto('/ko/about')
        await page.getByTestId('search-drawer-trigger').click()
        const drawer = page.getByRole('dialog')
        await drawer.getByRole('searchbox').fill('React')
        await expect(
            drawer.getByRole('list').getByRole('link').first()
        ).toBeVisible()
        await expect(
            drawer.getByRole('link', { name: '전체 검색 결과 보기' })
        ).toBeInViewport()
        await drawer.screenshot({
            path: testInfo.outputPath(`search-${theme}.png`),
        })
    })
}

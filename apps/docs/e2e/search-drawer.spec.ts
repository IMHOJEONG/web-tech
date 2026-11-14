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
    const options = page.getByRole('dialog').getByRole('option')
    await expect(options).toHaveCount(2)
    await options.first().focus()
    await options.first().press('ArrowDown')
    await expect(options.nth(1)).toBeFocused()
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true')
    await options.nth(1).press('ArrowUp')
    await expect(options.first()).toBeFocused()
    await expect(options.first()).toHaveAttribute('aria-selected', 'true')
    await options.first().press('ArrowUp')
    await expect(options.nth(1)).toBeFocused()
    await options.nth(1).press('ArrowDown')
    await expect(options.first()).toBeFocused()
    await options.first().press('Enter')
    await expect(page).toHaveURL(new RegExp(`/ko${articleHref}$`))
    await expect(page.getByRole('dialog')).toBeHidden()
})

for (const locale of ['ko', 'en']) {
    test(`${locale}: modal autocomplete debounces typing and supports keyboard selection`, async ({
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
        const input = drawer.getByRole('combobox')
        await expect(input).toBeFocused()
        const bounds = (await drawer.boundingBox())!
        expect(bounds.width).toBeGreaterThanOrEqual(
            Math.min(390, page.viewportSize()!.width)
        )
        await expect
            .poll(async () => {
                const current = (await drawer.boundingBox())!
                return current.x + current.width
            })
            .toBeLessThanOrEqual(page.viewportSize()!.width + 1)
        await expect(drawer.getByRole('option')).toHaveCount(1)
        requested.length = 0
        await input.fill('r')
        await input.fill('re')
        await input.fill('rea')
        await expect(drawer.getByRole('option')).toContainText('rea document')
        expect(requested).toEqual(['rea'])
        await expect(page).toHaveURL(new RegExp(`/${locale}/about$`))
        await input.press('ArrowDown')
        await expect(drawer.getByRole('option')).toHaveAttribute(
            'aria-selected',
            'true'
        )
        const selectedId = await drawer.getByRole('option').getAttribute('id')
        await expect(input).toHaveAttribute(
            'aria-activedescendant',
            selectedId!
        )
        await input.press('Enter')
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
        const input = drawer.getByRole('combobox')
        await input.fill('slow')
        await expect.poll(() => slowStarted).toBe(true)
        await input.fill('fast')
        await expect(drawer.getByRole('option')).toContainText('fast document')
        release()
        await expect(drawer.getByRole('option')).not.toContainText(
            'slow document'
        )
        await input.fill('broken')
        await expect(
            drawer.getByText('검색 결과를 불러오지 못했어요.', { exact: false })
        ).toBeVisible()
        fail = false
        await drawer.getByRole('button', { name: '다시 시도' }).click()
        await expect(drawer.getByRole('option')).toContainText(
            'broken document'
        )
        await input.fill('nothing')
        await expect(
            drawer.getByText('일치하는 문서가 없어요.', { exact: false })
        ).toBeVisible()
        await expect(drawer.getByRole('option')).toHaveCount(0)
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
    const input = drawer.getByRole('combobox')
    await expect(drawer.getByRole('option')).toHaveCount(1)
    queries.length = 0
    await input.dispatchEvent('compositionstart')
    await input.fill('가'.repeat(41))
    await input.press('Escape')
    await expect(drawer).toBeVisible()
    await input.dispatchEvent('compositionend')
    await expect(input).toHaveValue('가'.repeat(40))
    await expect.poll(() => queries).toEqual(['가'.repeat(40)])
    await page.setViewportSize({ width: 390, height: 600 })
    await expect(drawer).toBeVisible()
    const bounds = await drawer.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.width).toBeLessThanOrEqual(391)
    await input.dispatchEvent('compositionstart')
    await input.fill('나'.repeat(41))
    await drawer.getByRole('button', { name: '검색 닫기' }).click()
    await expect(drawer).toBeHidden()
    await expect(page.getByTestId('search-drawer-trigger')).toBeFocused()
    await page.getByTestId('search-drawer-trigger').click()
    await expect(input).toHaveValue('나'.repeat(40))
    await expect(drawer.getByRole('option')).toHaveCount(1)
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
        await drawer.getByRole('combobox').fill('React')
        await expect(drawer.getByRole('option').first()).toBeVisible()
        await expect(
            drawer.getByRole('link', { name: '전체 검색 결과 보기' })
        ).toBeInViewport()
        await drawer.screenshot({
            path: testInfo.outputPath(`search-${theme}.png`),
        })
    })
}

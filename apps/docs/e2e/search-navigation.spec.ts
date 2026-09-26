import { expect, test, type Page } from '@playwright/test'

function searchForm(page: Page, location: 'header' | 'index') {
    return location === 'header'
        ? page.locator('header form[role="search"]')
        : page.getByRole('main').getByRole('search')
}

for (const locale of ['ko', 'en']) {
    for (const location of ['header', 'index'] as const) {
        test(`${locale}/${location}: searches without a document reload and preserves history`, async ({
            page,
        }) => {
            await page.goto(`/${locale}/docs?section=web&sort=latest&page=2`)
            const form = searchForm(page, location)
            if (location === 'header')
                await form.locator('button[aria-expanded]').click()
            const input = form.locator('input')
            await input.fill('  React  ')
            await page.evaluate(() => {
                document.documentElement.dataset.searchProbe = 'same-document'
            })
            const documentRequests: string[] = []
            page.on('request', (request) => {
                if (
                    request.isNavigationRequest() &&
                    request.frame() === page.mainFrame()
                )
                    documentRequests.push(request.url())
            })
            await input.press('Enter')
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?q=React$`)
            )
            await expect(page.getByRole('main')).toContainText('React')
            await expect(page.locator('html')).toHaveAttribute(
                'data-search-probe',
                'same-document'
            )
            expect(documentRequests).toEqual([])

            if (location === 'header')
                await form.locator('button[aria-expanded]').click()
            await input.fill(' React ')
            const historyLength = await page.evaluate(() => history.length)
            await form.locator('button[type="submit"]').click()
            await expect(input).toHaveValue('React')
            await expect(form).toHaveAttribute('aria-busy', 'false')
            expect(await page.evaluate(() => history.length)).toBe(
                historyLength
            )

            await input.fill('  ')
            await form.locator('button[type="submit"]').click()
            await expect(page).toHaveURL(new RegExp(`/${locale}/docs$`))
            await page.goBack()
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?q=React$`)
            )
            await expect(
                page.getByRole('main').locator('input[name="q"]')
            ).toHaveValue('React')
            await page.goForward()
            await expect(page).toHaveURL(new RegExp(`/${locale}/docs$`))
            expect(documentRequests).toEqual([])
        })

        test(`${locale}/${location}: pending feedback blocks repeated submission without resizing`, async ({
            page,
        }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' })
            await page.goto(`/${locale}/docs`)
            const form = searchForm(page, location)
            if (location === 'header')
                await form.locator('button[aria-expanded]').click()
            const input = form.locator('input')
            const submit = form.locator('button[type="submit"]')
            await input.fill('component')
            const width = (await submit.boundingBox())!.width
            let release!: () => void
            const gate = new Promise<void>((resolve) => {
                release = resolve
            })
            let held = 0
            await page.route('**/docs?**', async (route) => {
                if (
                    new URL(route.request().url()).searchParams.get('q') ===
                    'component'
                ) {
                    held++
                    await gate
                }
                await route.continue()
            })
            try {
                await submit.click()
                await expect.poll(() => held).toBeGreaterThan(0)
                await expect(form).toHaveAttribute('aria-busy', 'true')
                await expect(submit).toBeDisabled()
                await expect(form.getByRole('status')).toHaveText(
                    locale === 'ko'
                        ? '검색 결과를 불러오는 중'
                        : 'Loading search results'
                )
                await expect(submit.locator('svg.animate-spin')).toHaveCSS(
                    'animation-name',
                    'none'
                )
                expect((await submit.boundingBox())!.width).toBe(width)
                await input.press('Enter')
                await form.dispatchEvent('submit')
            } finally {
                release()
            }
            await expect(page).toHaveURL(
                new RegExp(`/${locale}/docs\\?q=component$`)
            )
            await expect(searchForm(page, location)).toHaveAttribute(
                'aria-busy',
                'false'
            )
            expect(held).toBe(1)
        })
    }

    test(`${locale}: isolated index form retains native GET semantics without handlers`, async ({
        browser,
        baseURL,
        page,
    }) => {
        await page.goto(`/${locale}/docs`)
        const markup = await page
            .getByRole('main')
            .getByRole('search')
            .evaluate((form) => form.outerHTML)
        const context = await browser.newContext({
            javaScriptEnabled: false,
            baseURL,
        })
        try {
            // Isolate the form contract from the page's streamed Suspense shell.
            const nativePage = await context.newPage()
            await nativePage.setContent(`<base href="${baseURL}">${markup}`)
            const form = nativePage.getByRole('search')
            await form.locator('input').fill(' React ')
            const submitted = nativePage.waitForRequest((request) =>
                request.isNavigationRequest()
            )
            await form.locator('button[type="submit"]').click()
            const request = await submitted
            expect(request.method()).toBe('GET')
            expect(new URL(request.url()).pathname).toBe(`/${locale}/docs`)
            expect(new URL(request.url()).searchParams.get('q')).toBe(' React ')
        } finally {
            await context.close()
        }
    })
}

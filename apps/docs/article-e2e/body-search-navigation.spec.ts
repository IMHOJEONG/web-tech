import { randomUUID } from 'node:crypto'
import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test'

const documentPath = '/docs/web/article-e2e-publication'
const keyword = 'bodyonlypublicationv1needle'
const missingKeyword = 'bodyonlypublicationv2needle'

async function resetPublication(request: APIRequestContext) {
    const origin = await request.post(
        'http://127.0.0.1:3112/__test/publication/1',
        {
            headers: { Authorization: 'Bearer article-e2e-only-control' },
        }
    )
    expect(origin.status()).toBe(204)
    const invalidated = await request.post('/api/revalidate/content', {
        headers: { Authorization: 'Bearer article-e2e-only-revalidation' },
    })
    expect(invalidated.status()).toBe(200)
}

function searchForm(page: Page, location: 'header' | 'index') {
    return location === 'header'
        ? page.locator('header form[role="search"]')
        : page.getByRole('main').getByRole('search')
}

for (const locale of ['ko', 'en']) {
    for (const location of ['header', 'index'] as const) {
        test(`user search: ${locale}/${location} finds a remote body and opens its card without document reload`, async ({
            page,
            request,
        }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            try {
                await resetPublication(request)
                // Direct access bootstraps the screen; tested transitions use forms and Link clicks.
                await page.goto(
                    `/${locale}/docs?section=web&sort=latest&page=2`
                )
                await expect(
                    page.getByTestId('mobile-nav-drawer-trigger')
                ).toBeEnabled()
                const form = searchForm(page, location)
                if (location === 'header') {
                    await form.locator('button[aria-expanded]').click()
                    await expect(
                        form.locator('button[aria-expanded]')
                    ).toHaveAttribute('aria-expanded', 'true')
                }
                const input = form.locator('input[name="q"]')
                await expect(input).toBeVisible()
                await input.fill(`  ${keyword}  `)

                const identity = randomUUID()
                await page.evaluate(
                    (value) =>
                        Reflect.set(window, '__bodySearchIdentity', value),
                    identity
                )
                const documentRequests: string[] = []
                page.on('request', (request) => {
                    if (
                        request.isNavigationRequest() &&
                        request.frame() === page.mainFrame()
                    ) {
                        documentRequests.push(new URL(request.url()).pathname)
                    }
                })

                await test.step('Submit a real form and clear prior browse controls', async () => {
                    if (location === 'header') await input.press('Enter')
                    else await form.locator('button[type="submit"]').click()
                    await expect(page).toHaveURL(`/${locale}/docs?q=${keyword}`)
                    await expect(
                        searchForm(page, 'index').locator('input[name="q"]')
                    ).toHaveValue(keyword)
                    await expect(searchForm(page, 'index')).toHaveAttribute(
                        'aria-busy',
                        'false'
                    )
                    if (location === 'header') {
                        await expect(
                            searchForm(page, 'header').locator(
                                'button[aria-expanded]'
                            )
                        ).toHaveAttribute('aria-expanded', 'false')
                    }
                })

                const destination = `/${locale}${documentPath}`
                const card = page
                    .getByRole('main')
                    .locator(`a[href="${destination}"]`)
                await test.step('Read the body match and open its card with Link', async () => {
                    await expect(card).toHaveCount(1)
                    await expect(card.getByRole('heading')).toHaveText(
                        'Publication cache probe V1'
                    )
                    await expect(card).toContainText(keyword)
                    await card.click()
                    await expect(page).toHaveURL(destination)
                    await expect(
                        page
                            .locator('.mdx-wrapper')
                            .getByText(keyword, { exact: true })
                    ).toBeVisible()
                    await expect(
                        page.getByTestId('article-pending')
                    ).toHaveCount(0)
                    await expect(
                        page.getByTestId('article-supplementary')
                    ).toHaveCount(1)
                    await expect(
                        page.getByTestId('article-supplementary-pending')
                    ).toHaveCount(0)
                })

                await test.step('Back restores the body search and its input', async () => {
                    await page.goBack()
                    await expect(page).toHaveURL(`/${locale}/docs?q=${keyword}`)
                    await expect(
                        searchForm(page, 'index').locator('input[name="q"]')
                    ).toHaveValue(keyword)
                    await expect(card).toContainText(keyword)
                })

                await test.step('The empty-result recovery link returns to the index', async () => {
                    const indexForm = searchForm(page, 'index')
                    await indexForm
                        .locator('input[name="q"]')
                        .fill(missingKeyword)
                    await indexForm.locator('button[type="submit"]').click()
                    await expect(page).toHaveURL(
                        `/${locale}/docs?q=${missingKeyword}`
                    )
                    await expect(
                        page.getByRole('main').getByRole('heading', {
                            level: 1,
                            name:
                                locale === 'ko'
                                    ? '검색 결과가 없어요'
                                    : 'No matching documents',
                            exact: true,
                        })
                    ).toBeVisible()
                    await expect(card).toHaveCount(0)
                    const recovery = page.getByRole('main').getByRole('link', {
                        name:
                            locale === 'ko'
                                ? '전체 문서로 돌아가기'
                                : 'Back to all docs',
                        exact: true,
                    })
                    await expect(recovery).toHaveAttribute(
                        'href',
                        `/${locale}/docs`
                    )
                    await recovery.click()
                    await expect(page).toHaveURL(`/${locale}/docs`)
                    await expect(
                        searchForm(page, 'index').locator('input[name="q"]')
                    ).toHaveValue('')
                    await expect(card).toHaveCount(1)
                })

                expect(
                    await page.evaluate(
                        (value) =>
                            Reflect.get(window, '__bodySearchIdentity') ===
                            value,
                        identity
                    )
                ).toBe(true)
                expect(documentRequests).toEqual([])
                expect(errors, 'Unhandled browser errors').toEqual([])
            } finally {
                await resetPublication(request)
            }
        })
    }
}

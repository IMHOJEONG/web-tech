import { expect, test, type Locator, type Page } from '@playwright/test'

const path = '/ko/docs/category/be/node-js/node-brotli-runtime-security'

test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({
        'x-article-heading-fixture': 'synthetic-headings',
    })
    await page.emulateMedia({ reducedMotion: 'reduce' })
})

async function openFixture(page: Page, hash = '') {
    await page.goto(path + hash)
    await expect(
        page.getByRole('heading', {
            name: 'Authored introduction',
            exact: true,
        })
    ).toBeVisible()
}

async function expectBelowHeader(heading: Locator) {
    await expect
        .poll(() =>
            heading.evaluate((element) => {
                const top = element.getBoundingClientRect().top
                const header = document
                    .querySelector('header')!
                    .getBoundingClientRect()
                return top >= header.bottom + 8 && top < innerHeight * 0.75
            })
        )
        .toBe(true)
}

async function followToc(page: Page, title: string, index = 0) {
    const mobile = (page.viewportSize()?.width ?? 0) < 1024
    const toc = mobile
        ? page.getByTestId('article-mobile-toc').locator('details')
        : page.locator('aside details').first()
    if ((await toc.getAttribute('open')) === null)
        await toc.locator('summary').click()
    const link = toc.getByRole('link', { name: title, exact: true }).nth(index)
    const id = decodeURIComponent((await link.getAttribute('href'))!.slice(1))
    const heading = page
        .getByRole('heading', { name: title, exact: true })
        .nth(index)
    await expect(heading).toHaveAttribute('id', id)
    await link.click()
    await expectBelowHeader(heading)
    if (mobile) {
        await expect(toc).not.toHaveAttribute('open')
        await expect(heading).toBeFocused()
    }
}

test('authored IDs stay unique and TOC reaches the generated heading instead', async ({
    page,
}) => {
    await openFixture(page)
    const ids = await page
        .locator('[data-offline-content] [id]')
        .evaluateAll((elements) => elements.map((element) => element.id))
    expect(new Set(ids).size).toBe(ids.length)
    await expect(
        page.getByRole('heading', {
            name: 'Authored introduction',
            exact: true,
        })
    ).toHaveAttribute('id', 'intro')
    await expect(
        page.getByRole('heading', { name: 'Intro', exact: true })
    ).not.toHaveAttribute('id', /^(intro|intro-1)$/)
    await followToc(page, 'Intro')
    await page.setExtraHTTPHeaders({})
    await page.goto(path)
    await expect(
        page.getByRole('heading', {
            name: '1/2 — 압축할 바이트 만들기',
            exact: true,
        })
    ).toBeVisible()
    await expect(
        page.getByRole('heading', {
            name: 'Authored introduction',
            exact: true,
        })
    ).toHaveCount(0)
})

for (const depth of [1, 2, 3, 4] as const) {
    test(`custom h${depth} renderers keep both duplicate-title targets usable`, async ({
        page,
    }) => {
        await openFixture(page)
        const title = `Repeated level ${depth}`
        const headings = page.getByRole('heading', {
            level: depth,
            name: title,
            exact: true,
        })
        await expect(headings).toHaveCount(2)
        const base = `repeated-level-${depth}`
        await expect(headings.nth(0)).toHaveAttribute('id', base)
        await expect(headings.nth(1)).toHaveAttribute('id', `${base}-1`)
        if (depth === 1) {
            for (const id of [base, `${base}-1`]) {
                await page.evaluate((value) => {
                    location.hash = value
                }, id)
                await expectBelowHeader(headings.nth(id === base ? 0 : 1))
            }
        } else {
            await followToc(page, title, 0)
            await followToc(page, title, 1)
        }
    })
}

test('h5 and h6 TOC targets stay below the sticky header', async ({ page }) => {
    await openFixture(page)
    await followToc(page, 'Deep five')
    await followToc(page, 'Deep six')
})

test('a legacy fragment works on a direct request and reload through the real MDX route', async ({
    page,
}) => {
    const title = 'Compatibility 1/5 — timing'
    const hash = '#compatibility-15-timing'
    await openFixture(page, hash)
    const heading = page.getByRole('heading', { name: title, exact: true })
    await expect(heading).toHaveAttribute('id', 'compatibility-15--timing')
    await expect(heading.locator('.mdx-heading-alias')).toHaveAttribute(
        'id',
        hash.slice(1)
    )
    await expectBelowHeader(heading)
    await page.reload()
    await expectBelowHeader(heading)
})

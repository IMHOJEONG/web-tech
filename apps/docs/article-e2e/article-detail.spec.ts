import { expect, test, type Page } from '@playwright/test'

const articles = [
    {
        name: 'local data',
        path: '/docs/web/javascript-event-loop-runtime',
        title: 'JavaScript Event Loop 런타임 노트',
        firstHeading: '이벤트 루프를 보는 이유',
        paragraph: '동기 코드는 call stack에서 바로 실행된다.',
        lastHeading: '참고',
        ending: '이벤트 루프는 특정 API 이름보다 실행 순서와 큐의 성격을 이해하는 쪽이 중요하다.',
    },
    {
        name: 'local category canonical route',
        path: '/docs/category/fe/react/server-client-component-boundary',
        title: 'Server Component와 Client Component 경계',
        firstHeading: '경계를 먼저 정해야 하는 이유',
        paragraph: '서버 컴포넌트와 클라이언트 컴포넌트는 실행 위치가 다르다.',
        lastHeading: '판단 기준',
        ending: '서버에서 가져온 데이터는 직렬화 가능한 props로 클라이언트에 넘긴다.',
    },
    {
        name: 'remote HTML',
        path: '/docs/web/article-e2e-remote',
        title: 'Remote article rendering probe',
        firstHeading: 'Remote article rendering probe',
        paragraph: 'This paragraph came from the authenticated body endpoint.',
        lastHeading: 'Final remote section',
        ending: 'The remote article has finished rendering.',
    },
]

async function expectCompleteArticle(
    page: Page,
    article: (typeof articles)[number]
) {
    // Scope to the body: titles in metadata, TOC and related cards aren't proof.
    const body = page.locator('.mdx-wrapper')
    await expect(body).toHaveCount(1)
    await expect(
        body.getByRole('heading', { name: article.firstHeading, exact: true })
    ).toBeVisible()
    await expect(
        body.getByText(article.paragraph, { exact: true })
    ).toBeVisible()
    await expect(
        body.getByRole('heading', { name: article.lastHeading, exact: true })
    ).toBeVisible()
    await expect(body.getByText(article.ending, { exact: true })).toBeVisible()
    await expect(page).toHaveTitle(article.title)
    await expect(page.getByTestId('article-supplementary')).toHaveCount(1)
    await expect(page.getByTestId('article-supplementary-pending')).toHaveCount(
        0
    )
    await expect(page.locator('#article-reading-navigation-title')).toHaveCount(
        1
    )
    await expect(page.getByTestId('article-pending')).toHaveCount(0)
    await expect(body.getByText('Loading...', { exact: true })).toHaveCount(0)
    await expect(
        page.getByRole('heading', {
            name: /요청한 문서를 찾지 못했습니다|문서를 가져오는 중에 문제가 생겼습니다/,
        })
    ).toHaveCount(0)
    await expect(
        page.locator('meta[name="robots"][content*="noindex"]')
    ).toHaveCount(0)
}

for (const locale of ['ko', 'en']) {
    for (const article of articles) {
        test(`${locale}: ${article.name} renders complete body on navigation and reload`, async ({
            page,
        }) => {
            const errors: string[] = []
            page.on('pageerror', (error) => errors.push(error.message))
            const path = `/${locale}${article.path}`
            const response = await page.goto(path)
            expect(response?.status()).toBe(200)
            await expect(page).toHaveURL(path)
            await expectCompleteArticle(page, article)
            const reloaded = await page.reload()
            expect(reloaded?.status()).toBe(200)
            await expectCompleteArticle(page, article)
            expect(errors, 'Unhandled browser errors').toEqual([])
        })
    }

    test(`${locale}: missing document renders not-found instead of an empty article`, async ({
        page,
    }) => {
        // A streamed not-found response can be HTTP 200; inspect the actual UI.
        await page.goto(`/${locale}/docs/web/article-e2e-missing`)
        await expect(
            page.getByRole('heading', {
                name: '요청한 문서를 찾지 못했습니다',
                exact: true,
            })
        ).toBeVisible()
        await expect(page.locator('.mdx-wrapper')).toHaveCount(0)
        await expect(page.getByTestId('article-pending')).toHaveCount(0)
    })
}

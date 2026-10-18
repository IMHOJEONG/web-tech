import { expect, type Page } from '@playwright/test'

export const articles = [
    {
        name: 'local data',
        path: '/docs/web/javascript-event-loop-runtime',
        title: 'JavaScript Event Loop 런타임 노트',
        firstHeading: '이벤트 루프를 보는 이유',
        paragraph:
            '호출 스택(call stack): 현재 실행 중인 함수 호출을 관리한다. 동기 코드는 실행 도중에 microtask 때문에 끊기지 않는다.',
        lastHeading: '참고',
        ending: 'MDN: queueMicrotask와 microtask 처리',
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

// Direct access and Link navigation must prove the same complete article.
export async function expectCompleteArticle(
    page: Page,
    article: (typeof articles)[number]
) {
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
    const structuredData = page.locator('script[type="application/ld+json"]')
    await expect(structuredData).toHaveCount(1)
    const data = JSON.parse((await structuredData.textContent()) ?? '{}')
    const canonical = await page
        .locator('link[rel="canonical"]')
        .getAttribute('href')
    expect(data['@type']).toBe('BlogPosting')
    expect(data.headline).toBe(article.title)
    expect(data.url).toBe(canonical)
    expect(new URL(data.url).pathname).toBe(new URL(page.url()).pathname)
    const sharingImage = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content')
    expect(new URL(sharingImage ?? '').pathname).toBe('/og/article.png')
    expect(new URL(sharingImage ?? '').searchParams.get('title')).toBe(
        article.title
    )
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

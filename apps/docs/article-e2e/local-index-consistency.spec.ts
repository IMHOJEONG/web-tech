import { expect, test } from '@playwright/test'

for (const locale of ['ko', 'en']) {
    test(`${locale}: category and search share local document metadata`, async ({
        page,
    }) => {
        const title = 'Server Component와 Client Component 경계'
        const summary =
            'React 기반 앱에서 서버 컴포넌트와 클라이언트 컴포넌트를 나눌 때의 판단 기준을 정리합니다.'
        const href = `/${locale}/docs/category/fe/react/server-client-component-boundary`
        for (const route of [
            `/${locale}/category/fe/react`,
            `/${locale}/docs?q=${encodeURIComponent(title)}`,
        ]) {
            await page.goto(route)
            const card = page.locator(`main a[href="${href}"]`)
            await expect(card).toHaveCount(1)
            await expect(card).toContainText(title)
            await expect(card).toContainText(
                route.includes('/docs?q=')
                    ? '경계를 먼저 정해야 하는 이유'
                    : summary
            )
        }
    })
}

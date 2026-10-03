import { expect, test } from '@playwright/test'

test('title-based OG images render as cacheable PNGs with the bundled Korean font', async ({
    request,
}) => {
    for (const title of [
        '첫 화면은 어디에서 늦어지는가',
        '브라우저 렌더링과 서버 컴포넌트의 경계를 이해하기 위한 긴 제목 '.repeat(
            5
        ),
        '',
    ]) {
        const query = new URLSearchParams({
            title,
            topic: 'BROWSER PERFORMANCE',
            author: 'HoJeong Im',
        })
        const response = await request.get(`/og/article.png?${query}`)
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toBe('image/png')
        expect(response.headers()['cache-control']).toContain('s-maxage=86400')
        expect(response.headers()['x-content-type-options']).toBe('nosniff')
        const png = await response.body()
        expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
        expect(png.readUInt32BE(16)).toBe(1200)
        expect(png.readUInt32BE(20)).toBe(630)
        expect(png.length).toBeGreaterThan(1000)
    }
})

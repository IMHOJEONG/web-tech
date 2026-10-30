import { expect, test, type Page } from '@playwright/test'

const article = '/ko/docs/web/javascript-event-loop-runtime'
const limit = 1024 * 1024

async function savedDigest(page: Page) {
    return page.evaluate(async (path) => {
        const cache = await caches.open('heap-forge-offline-articles-v1')
        const response = await cache.match(location.origin + path)
        if (!response) return null
        const digest = await crypto.subtle.digest(
            'SHA-256',
            await response.arrayBuffer()
        )
        return Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, '0')
        ).join('')
    }, article)
}

for (const { name, unit } of [
    { name: 'ASCII', unit: 'a' },
    { name: '한글', unit: '가' },
    { name: '이모지', unit: '🙂' },
]) {
    test(`${name}: raw HTML byte boundary accepts below/exact limit and preserves saved copy on overflow`, async ({
        page,
    }) => {
        await page.goto(article)
        await expect(
            page.locator('[data-offline-content] [data-offline-loading]')
        ).toHaveCount(0)
        const panel = page.getByRole('region', {
            name: '오프라인 열람',
            exact: true,
        })
        const button = panel.getByRole('button', {
            name: /^(오프라인 저장|저장본 업데이트)$/,
        })
        await expect(button).toBeEnabled()

        for (const delta of [-1, 0, 1]) {
            const bytes = limit + delta
            const measured = await page.evaluate(
                ({ bytes, unit }) => {
                    const root = document.querySelector<HTMLElement>(
                        '[data-offline-content]'
                    )
                    if (!root) throw new Error('Missing article root')
                    const encoder = new TextEncoder()
                    const bodyBytes =
                        bytes - encoder.encode('<p></p>').byteLength
                    const unitBytes = encoder.encode(unit).byteLength
                    root.innerHTML = `<p>${unit.repeat(Math.floor(bodyBytes / unitBytes))}${'a'.repeat(bodyBytes % unitBytes)}</p>`
                    return encoder.encode(root.innerHTML).byteLength
                },
                { bytes, unit }
            )
            expect(measured).toBe(bytes)
            const before = await savedDigest(page)
            await button.click()
            if (delta <= 0) {
                await expect(panel.getByRole('status')).toContainText(
                    '이 브라우저에 저장했습니다'
                )
                await expect(button).toHaveText('저장본 업데이트')
                const after = await savedDigest(page)
                expect(after).not.toBeNull()
                expect(after).not.toBe(before)
            } else {
                await expect(panel.getByRole('status')).toContainText(
                    '저장 가능한 글 크기를 초과했습니다'
                )
                expect(await savedDigest(page)).toBe(before)
            }
            await expect(button).toBeEnabled()
        }
    })
}

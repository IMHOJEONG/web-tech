import { expect, test, type Page } from '@playwright/test'

const article = '/ko/docs/web/javascript-event-loop-runtime'
async function openArticle(page: Page) {
    await page.goto(article)
    await expect(
        page.getByRole('button', { name: '오프라인 저장', exact: true })
    ).toBeEnabled()
}
async function save(page: Page) {
    await page
        .getByRole('button', { name: /^(오프라인 저장|저장본 업데이트)$/ })
        .click()
    await expect(
        page.getByRole('button', { name: '저장본 업데이트', exact: true })
    ).toBeEnabled()
}
async function savedHtml(page: Page) {
    return page.evaluate(
        async (path) =>
            (
                await (
                    await caches.open('heap-forge-offline-articles-v1')
                ).match(location.origin + path)
            )?.text(),
        article
    )
}

test('only explicit saves persist; stored articles survive a completely offline navigation', async ({
    page,
    context,
}) => {
    await openArticle(page)
    expect(
        await page.evaluate(
            async () =>
                (await caches.keys()).filter((key) =>
                    key.startsWith('heap-forge-offline-articles')
                ).length
        )
    ).toBe(0)
    const text = (await page
        .locator('[data-offline-content] h2')
        .first()
        .textContent())!.trim()
    await save(page)
    await context.setOffline(true)
    await page.reload()
    await expect(
        page.getByText('오프라인 저장본이며 최신 원문과 다를 수 있습니다', {
            exact: false,
        })
    ).toBeVisible()
    await expect(
        page.getByRole('heading', { name: text, exact: true })
    ).toBeVisible()
    await page.goto('/offline.html?lang=ko')
    await expect(
        page.getByRole('heading', { name: '저장한 글', exact: true })
    ).toBeVisible()
    await expect(page.locator('#articles li')).toHaveCount(1)
    await page.getByRole('button', { name: /^삭제:/ }).click()
    await expect(page.locator('#articles li')).toHaveCount(0)
    await expect(page.getByRole('status').last()).toContainText(
        '저장한 글이 없습니다'
    )
})

test('saved copies update only after a second explicit save and exclude executable DOM', async ({
    page,
}) => {
    await openArticle(page)
    await page.evaluate(() => {
        const root = document.querySelector('[data-offline-content]')!
        const extra = document.createElement('div')
        extra.innerHTML =
            '<p>offline-test-safe-text</p><script>window.offlineUnsafe = true</script><form><input value="private-test" /></form><a href="javascript:alert(1)" onclick="alert(1)">unsafe-link</a><iframe src="about:blank"></iframe>'
        root.append(extra)
    })
    await save(page)
    const before = await savedHtml(page)
    expect(before).toContain('offline-test-safe-text')
    expect(before).not.toMatch(
        /<script\b|<iframe\b|<form\b|onclick=|javascript:|private-test/i
    )
    await page.evaluate(() => {
        const p = document.createElement('p')
        p.textContent = 'explicit-update-marker'
        document.querySelector('[data-offline-content]')!.append(p)
    })
    expect(await savedHtml(page)).not.toContain('explicit-update-marker')
    await save(page)
    expect(await savedHtml(page)).toContain('explicit-update-marker')
    expect(
        await page.evaluate(
            async () =>
                (
                    await (
                        await caches.open('heap-forge-offline-articles-v1')
                    ).keys()
                ).length
        )
    ).toBe(1)
})

test('blocked images degrade to an explanation while small same-origin images remain available offline', async ({
    page,
    context,
}) => {
    await openArticle(page)
    await page.evaluate(() => {
        const root = document.querySelector('[data-offline-content]')!
        const missing = document.createElement('img')
        missing.src = '/diagrams/does-not-exist.png'
        missing.alt = 'blocked-test-image'
        const present = document.createElement('img')
        present.src = '/diagrams/tcp-socket-endpoints.png'
        present.alt = 'saved-test-image'
        root.append(missing, present)
    })
    await save(page)
    await expect(page.getByRole('status').last()).toContainText('저장하지 못해')
    await context.setOffline(true)
    await page.goto(`/offline.html?article=${encodeURIComponent(article)}`)
    await expect(
        page.getByText('저장되지 않은 이미지: blocked-test-image', {
            exact: true,
        })
    ).toBeVisible()
    await expect
        .poll(() =>
            page
                .getByAltText('saved-test-image')
                .evaluate(
                    (image: HTMLImageElement) =>
                        image.complete && image.naturalWidth > 0
                )
        )
        .toBe(true)
})

test('failed storage never reports success or destroys the previously saved version', async ({
    page,
    context,
}) => {
    await openArticle(page)
    await save(page)
    const before = await savedHtml(page)
    await context.serviceWorkers()[0]!.evaluate(() => {
        Cache.prototype.put = async () => {
            throw new DOMException('Test quota', 'QuotaExceededError')
        }
    })
    await page
        .getByRole('button', { name: '저장본 업데이트', exact: true })
        .click()
    await expect(page.getByRole('status').last()).toContainText(
        '저장하지 못했습니다'
    )
    expect(await savedHtml(page)).toBe(before)
})

test('worker refuses API, preview, query and cross-origin keys; unsaved routes show the library offline', async ({
    page,
    context,
}) => {
    await openArticle(page)
    await save(page)
    const rejected = await page.evaluate(async () => {
        const worker = (await navigator.serviceWorker.getRegistration('/'))!
            .active!
        const results = []
        for (const path of [
            '/api/private',
            '/ko/preview/test',
            '/ko/docs/test?q=secret',
            'https://evil.example/ko/docs/test',
        ]) {
            results.push(
                await new Promise((resolve) => {
                    const channel = new MessageChannel()
                    channel.port1.onmessage = (event) => {
                        resolve(event.data.ok)
                        channel.port1.close()
                    }
                    worker.postMessage(
                        {
                            channel: 'heap-forge-offline-v1',
                            action: 'save',
                            snapshot: {
                                path,
                                title: 'Forbidden',
                                locale: 'ko',
                                body: '<p>Forbidden</p>',
                                missingImages: 0,
                            },
                        },
                        [channel.port2]
                    )
                })
            )
        }
        return results
    })
    expect(rejected).toEqual([false, false, false, false])
    await page.request.get('/api/search?q=not-stored')
    expect(
        await page.evaluate(async () =>
            (
                await (
                    await caches.open('heap-forge-offline-articles-v1')
                ).keys()
            ).map((request) => new URL(request.url).pathname)
        )
    ).toEqual([article])
    await context.setOffline(true)
    await page.goto('/ko/docs/not-saved')
    await expect(
        page.getByRole('heading', { name: '저장한 글', exact: true })
    ).toBeVisible()
    await expect(page.locator('#articles li')).toHaveCount(1)
})

test('English saved reader works offline and clears every saved copy only after confirmation', async ({
    page,
    context,
}) => {
    await page.goto(article.replace('/ko/', '/en/'))
    await page
        .getByRole('button', { name: 'Save offline', exact: true })
        .click()
    await expect(
        page.getByRole('button', { name: 'Update saved copy', exact: true })
    ).toBeEnabled()
    await context.setOffline(true)
    await page.goto('/offline.html?lang=en')
    await expect(
        page.getByRole('heading', { name: 'Saved articles', exact: true })
    ).toBeVisible()
    await page.locator('#articles a').click()
    await expect(
        page.getByText('Offline snapshot, not the latest live version', {
            exact: false,
        })
    ).toBeVisible()
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true)
    await page.goto('/offline.html?lang=en')
    page.once('dialog', (dialog) => dialog.dismiss())
    await page.getByRole('button', { name: 'Delete all', exact: true }).click()
    await expect(page.locator('#articles li')).toHaveCount(1)
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete all', exact: true }).click()
    await expect(page.locator('#articles li')).toHaveCount(0)
})

test('an unresolved article body cannot be saved as a loading placeholder', async ({
    page,
}) => {
    await openArticle(page)
    await page.evaluate(() => {
        const pending = document.createElement('div')
        pending.dataset.offlineLoading = ''
        pending.textContent = 'Loading...'
        document.querySelector('[data-offline-content]')!.append(pending)
    })
    await page
        .getByRole('button', { name: '오프라인 저장', exact: true })
        .click()
    await expect(page.getByRole('status').last()).toContainText(
        '본문을 불러오는 중입니다'
    )
    expect(
        await page.evaluate(() => caches.has('heap-forge-offline-articles-v1'))
    ).toBe(false)
    await page
        .locator('[data-offline-loading]')
        .evaluate((element) => element.remove())
    await save(page)
    expect(await savedHtml(page)).not.toContain('Loading...')
})

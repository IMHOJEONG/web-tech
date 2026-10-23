import { expect, test, type Page } from '@playwright/test'
import {
    openDocsIndexFilters,
    visibleDocsIndexFilters,
} from '../e2e/helpers/docs-index'

declare global {
    interface Window {
        contentMotionEvents: { name: string; collection: string | undefined }[]
    }
}

async function observeEntries(page: Page) {
    await page.evaluate(() => {
        window.contentMotionEvents = []
        document.addEventListener('animationstart', (event) => {
            if (event.target instanceof Element) {
                const collection = event.target.closest<HTMLElement>(
                    '[data-motion-results]'
                )
                window.contentMotionEvents.push({
                    name: event.animationName,
                    collection: collection?.dataset.motionResults,
                })
            }
        })
    })
}

test('landing and feed have no demo section and fetch no pilot media', async ({
    page,
}) => {
    const media: string[] = []
    page.on('request', (request) => {
        if (request.url().includes('/media/code-fold/'))
            media.push(request.url())
    })
    for (const path of ['/ko', '/ko/feed']) {
        await page.goto(path)
        await expect(page.locator('main h1')).toBeVisible()
        await expect(page.getByTestId('code-fold-demo')).toHaveCount(0)
        await expect(page.locator('main video')).toHaveCount(0)
    }
    expect(media).toEqual([])
})

test('a keyboard filter navigation replays only the result entries and preserves the focused filter', async ({
    page,
}, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/ko/feed')
    const recent = page.getByTestId('feed-recent-articles')
    await expect(recent.locator('li').first()).toBeVisible()
    await observeEntries(page)
    const web = recent.getByRole('link', { name: 'WEB', exact: true })
    await web.focus()
    await web.press('Enter')
    await expect(web).toHaveAttribute('aria-current', 'page')
    await expect(web).toBeFocused()
    await expect
        .poll(() =>
            page.evaluate(() =>
                window.contentMotionEvents.some(
                    (event) =>
                        event.name === 'docs-motion-reveal' &&
                        event.collection === 'web'
                )
            )
        )
        .toBe(true)
    const entries = await recent.locator('li').evaluateAll((elements) =>
        elements.map((element) => ({
            duration: getComputedStyle(element).animationDuration,
            delay: getComputedStyle(element).animationDelay,
        }))
    )
    expect(entries.every((entry) => entry.duration === '0.28s')).toBe(true)
    expect(entries.every((entry) => parseFloat(entry.delay) <= 0.175)).toBe(
        true
    )
    const card = recent.locator('li > a').first()
    await card.focus()
    await expect(card).toBeFocused()
    await expect(recent.locator('li').first()).toHaveCSS('opacity', '1')
    await expect(recent.locator('li').first()).toHaveCSS('transform', 'none')
    await page.keyboard.press('Tab')
    await testInfo.attach('filter-motion', {
        body: JSON.stringify({
            events: await page.evaluate(() => window.contentMotionEvents),
            entries,
        }),
        contentType: 'application/json',
    })
    await recent.screenshot({ path: testInfo.outputPath('feed-filter.png') })
})

test('hover lift is fine-pointer only and keyboard focus never moves a card', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/ko/feed')
    const card = page
        .getByTestId('feed-recent-articles')
        .locator('li > a')
        .first()
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    const fineHover = await page.evaluate(
        () => matchMedia('(hover: hover) and (pointer: fine)').matches
    )
    if (fineHover) {
        await expect
            .poll(() =>
                card.evaluate(
                    (element) =>
                        new DOMMatrixReadOnly(
                            getComputedStyle(element).transform
                        ).m42
                )
            )
            .toBe(-2)
    } else {
        await expect(card).toHaveCSS('transform', 'none')
    }
    await page.mouse.move(0, 0)
    await page.keyboard.press('Tab')
    await card.focus()
    await expect(card).toBeFocused()
    await expect(card).toHaveCSS('transform', 'none')
    expect(
        await card.evaluate((element) => element.matches(':focus-visible'))
    ).toBe(true)
    await expect(card).not.toHaveCSS('box-shadow', 'none')
})

test('reduced motion removes entries and transitions without removing selected or focused states', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko/feed')
    const recent = page.getByTestId('feed-recent-articles')
    const web = recent.getByRole('link', { name: 'WEB', exact: true })
    await web.click()
    await expect(web).toHaveAttribute('aria-current', 'page')
    const entry = recent.locator('li').first()
    const card = entry.locator('a')
    await expect(entry).toHaveCSS('animation-name', 'none')
    await expect(entry).toHaveCSS('opacity', '1')
    await expect(entry).toHaveCSS('transform', 'none')
    await expect(card).toHaveCSS('transition-duration', '0s')
    await expect(web).toHaveCSS('transition-duration', '0s')
    await card.hover()
    await expect(card).toHaveCSS('transform', 'none')
    await page.keyboard.press('Tab')
    await card.focus()
    await expect(card).not.toHaveCSS('box-shadow', 'none')
    await expect(card.getByRole('heading')).toHaveCSS(
        'transition-duration',
        '0s'
    )
})

test('web and docs filters reuse result entry motion with no narrow or large-text overflow', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/ko/web')
    await observeEntries(page)
    const filters = page.getByTestId('hub-topic-filters')
    await filters.getByRole('link', { name: /^React \d+$/ }).click()
    await expect(page).toHaveURL(/topic=react$/)
    await expect
        .poll(() =>
            page.evaluate(() =>
                window.contentMotionEvents.some(
                    (event) => event.collection === 'react'
                )
            )
        )
        .toBe(true)
    await expect(
        page.getByTestId('hub-results').locator('li').first()
    ).toHaveClass(/motion-reveal/)
    await page.goto('/ko/docs')
    await expect(
        page.locator('[data-motion-results="docs"]:visible')
    ).toHaveCount(1)
    await observeEntries(page)
    const controls = visibleDocsIndexFilters(page)
    await openDocsIndexFilters(page)
    await controls.getByRole('link', { name: 'Web', exact: true }).click()
    await expect(page).toHaveURL(/section=web/)
    await expect
        .poll(() =>
            page.evaluate(() =>
                window.contentMotionEvents.some(
                    (event) => event.collection === 'docs'
                )
            )
        )
        .toBe(true)
    await page.addStyleTag({ content: 'html { font-size: 32px !important; }' })
    for (const width of [320, 390, 844]) {
        await page.setViewportSize({ width, height: 900 })
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth
            )
        ).toBe(true)
    }
})

test('a live reduced-motion change settles an in-flight entry', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/ko/web')
    await page
        .getByTestId('hub-topic-filters')
        .getByRole('link', { name: /^React \d+$/ })
        .click()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const entry = page.getByTestId('hub-results').locator('li').first()
    await expect(entry).toHaveCSS('animation-name', 'none')
    await expect(entry).toHaveCSS('opacity', '1')
    await expect(entry).toHaveCSS('transform', 'none')
})

test('landing keyboard feedback stays visible and static in reduced motion across both themes', async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const theme of ['light', 'dark']) {
        await page.addInitScript(
            (value) => localStorage.setItem('theme', value),
            theme
        )
        await page.goto('/ko')
        const card = page.locator('main a.motion-interactive-row').first()
        await page.keyboard.press('Tab')
        await card.focus()
        await expect(card).toBeFocused()
        await expect(card).toHaveCSS('transform', 'none')
        await expect(card).toHaveCSS('transition-duration', '0s')
        await expect(card).not.toHaveCSS('box-shadow', 'none')
        await expect(card.getByRole('heading')).toHaveCSS(
            'transition-duration',
            '0s'
        )
        await expect(card.locator('span').last()).toHaveCSS(
            'transition-duration',
            '0s'
        )
    }
})

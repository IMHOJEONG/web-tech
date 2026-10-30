import type { Browser, Page } from '@playwright/test'

interface FrozenSkeletonOptions {
    browser: Browser
    page: Page
    serverHtml: string
    kind: string
    theme: 'light' | 'dark'
    isMobile?: boolean
    hasTouch?: boolean
}

export function readSkeletonGeometry(el: Element) {
    if (!el.isConnected)
        throw new Error('Cannot measure a detached skeleton element')
    const box = el.getBoundingClientRect()
    return {
        left: box.left,
        width: box.width,
        top: box.top,
        titleTop: el.querySelector('h1')?.getBoundingClientRect().top,
        pageWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        animations: Array.from(el.querySelectorAll('*')).filter(
            (node) => getComputedStyle(node).animationName !== 'none'
        ).length,
    }
}

export async function createFrozenSkeletonPage({
    browser,
    page,
    serverHtml,
    kind,
    theme,
    isMobile,
    hasTouch,
}: FrozenSkeletonOptions): Promise<Page> {
    const sourceUrl = page.url()
    const markup = await page.evaluate(
        ({ serverHtml, kind }) => {
            const parser = new DOMParser()
            const rendered = parser.parseFromString(
                document.documentElement.outerHTML,
                'text/html'
            )
            const streamed = parser.parseFromString(serverHtml, 'text/html')
            const pending = streamed.querySelector(
                `[data-page-pending="${kind}"]`
            )
            const main = rendered.querySelector('main')
            if (!pending || !main)
                throw new Error(`Missing skeleton or rendered main: ${kind}`)
            const target = kind === 'article' ? main.parentElement : main
            if (!target) throw new Error(`Missing article layout: ${kind}`)
            target.replaceWith(rendered.importNode(pending, true))
            rendered.querySelectorAll('script').forEach((node) => node.remove())
            return `<!doctype html>${rendered.documentElement.outerHTML}`
        },
        { serverHtml, kind }
    )
    // Keep the real URL/CSS/viewport, but never mutate a React-owned document.
    const context = await browser.newContext({
        viewport: page.viewportSize(),
        isMobile,
        hasTouch,
        colorScheme: theme,
        reducedMotion: 'reduce',
        javaScriptEnabled: false,
        serviceWorkers: 'block',
    })
    try {
        const frozen = await context.newPage()
        await frozen.route(
            (url) => url.href === sourceUrl,
            (route) => route.fulfill({ contentType: 'text/html', body: markup })
        )
        await frozen.goto(sourceUrl)
        await frozen.evaluate(() => document.fonts.ready)
        return frozen
    } catch (error) {
        await context.close()
        throw error
    }
}

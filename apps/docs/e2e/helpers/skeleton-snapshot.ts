import type { Page, Request } from '@playwright/test'

type CapturedFont = { body: Buffer; contentType: string }
const fontsByPage = new WeakMap<
    Page,
    Map<string, Promise<CapturedFont | null>>
>()

export function captureSkeletonFonts(page: Page) {
    const fonts = new Map<string, Promise<CapturedFont | null>>()
    fontsByPage.set(page, fonts)
    page.on('response', (response) => {
        if (response.request().resourceType() !== 'font') return
        fonts.set(
            response.url(),
            response
                .body()
                .then((body) => ({
                    body,
                    contentType:
                        response.headers()['content-type'] ?? 'font/woff2',
                }))
                .catch(() => null)
        )
    })
}

export async function openSkeletonSnapshot(
    source: Page,
    html: string,
    kind: string,
    theme: 'light' | 'dark'
): Promise<Page> {
    // Clone the rendered shell, never replace DOM owned by a live React root.
    const snapshot = await source.evaluate(
        ({ html, kind }) => {
            const parsed = new DOMParser().parseFromString(html, 'text/html')
            const pending = parsed.querySelector(
                `[data-page-pending="${kind}"]`
            )
            if (!pending) throw new Error(`Missing server skeleton: ${kind}`)
            // Reuse the already loaded CSSOM, not development chunk URLs that
            // another route compilation may replace while this page is measured.
            const styles = Array.from(document.styleSheets)
                .filter((sheet) => !sheet.disabled)
                .map((sheet) => {
                    const base = sheet.href ?? location.href
                    const css = Array.from(sheet.cssRules, (rule) => {
                        if (rule instanceof CSSImportRule)
                            throw new Error(
                                'Snapshot requires resolved CSS imports'
                            )
                        return rule.cssText
                    })
                        .join('\n')
                        .replace(
                            /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g,
                            (
                                _match,
                                double: string,
                                single: string,
                                bare: string
                            ) =>
                                `url(${JSON.stringify(new URL(double ?? single ?? bare.trim(), base).href)})`
                        )
                    const media = sheet.media.mediaText
                    return media ? `@media ${media} { ${css} }` : css
                })
                .join('\n')
            if (!styles) throw new Error('Missing loaded application styles')
            const shell = document.documentElement.cloneNode(
                true
            ) as HTMLElement
            shell
                .querySelectorAll(
                    'style, link[rel="stylesheet"], link[rel="preload"][as="style"]'
                )
                .forEach((node) => node.remove())
            const style = document.createElement('style')
            style.dataset.skeletonSnapshot = 'loaded-css'
            style.textContent = styles
            shell.querySelector('head')!.append(style)
            const main = shell.querySelector('main')
            const target = kind === 'article' ? main?.parentElement : main
            if (!target) throw new Error('Missing rendered content shell')
            target.replaceWith(pending.cloneNode(true))
            shell
                .querySelectorAll(
                    'script, link[rel="modulepreload"], link[rel="preload"][as="script"]'
                )
                .forEach((node) => node.remove())
            return `<!doctype html>${shell.outerHTML}`
        },
        { html, kind }
    )
    const frozen = await source.context().newPage()
    const fonts = new Map(
        await Promise.all(
            Array.from(
                fontsByPage.get(source) ?? [],
                async ([url, font]) => [url, await font] as const
            )
        )
    )
    const missingFonts: string[] = []
    const outstanding = new Map<Request, string>()
    frozen.on('request', (request) => {
        const url = new URL(request.url())
        outstanding.set(
            request,
            `${request.resourceType()}:${url.protocol.startsWith('http') ? url.pathname : url.protocol}`
        )
    })
    frozen.on('requestfinished', (request) => outstanding.delete(request))
    frozen.on('requestfailed', (request) => outstanding.delete(request))
    try {
        const cpuRate = Number(process.env.DOCS_SKELETON_CPU_RATE ?? '1')
        if (!Number.isFinite(cpuRate) || cpuRate < 1)
            throw new Error('Invalid skeleton CPU rate')
        if (cpuRate !== 1) {
            const session = await frozen.context().newCDPSession(frozen)
            await session.send('Emulation.setCPUThrottlingRate', {
                rate: cpuRate,
            })
        }
        const viewport = source.viewportSize()
        if (viewport) await frozen.setViewportSize(viewport)
        await frozen.emulateMedia({
            reducedMotion: 'reduce',
            colorScheme: theme,
        })
        await frozen.route('**/*', async (route) => {
            const request = route.request()
            if (request.resourceType() === 'font') {
                const font = fonts.get(request.url())
                if (!font) {
                    missingFonts.push(new URL(request.url()).pathname)
                    await route.abort()
                    return
                }
                await route.fulfill({
                    status: 200,
                    contentType: font.contentType,
                    body: font.body,
                })
            } else if (
                request.isNavigationRequest() &&
                request.url() === source.url()
            ) {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'content-type': 'text/html; charset=utf-8',
                        'content-security-policy': "script-src 'none'",
                    },
                    body: snapshot,
                })
            } else {
                await route.continue()
            }
        })
        await frozen.goto(source.url())
        await frozen.evaluate(() => document.fonts.ready)
        if (missingFonts.length)
            throw new Error(
                `Uncaptured skeleton fonts: ${JSON.stringify(missingFonts)}`
            )
        return frozen
    } catch (error) {
        const resources = [...outstanding.values()]
        await frozen.close()
        throw new Error(
            `Skeleton snapshot failed; outstanding resources: ${JSON.stringify(resources)}`,
            { cause: error }
        )
    }
}

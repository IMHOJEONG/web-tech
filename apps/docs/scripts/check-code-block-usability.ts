import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import { chromium, firefox, webkit } from '@playwright/test'
import { normalizeRemoteArticleHtml } from '../widgets/article-detail/model/normalize-remote-article-html.ts'

// Fix verification uses the worktree; keep the original baseline artifacts intact.
const css = await readFile(
    new URL('../app/css/mdx.css', import.meta.url),
    'utf8'
)
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
}).trim()
const code =
    Array.from(
        { length: 28 },
        (_, i) =>
            `const value${i} = ${i}; // ${i === 0 ? 'x'.repeat(240) : 'comment'}`
    ).join('\n') + '\n'
const remoteHtml = normalizeRemoteArticleHtml(
    `<pre><code class="language-ts">${code}</code></pre>`
).content
const output = await build({
    entryPoints: [
        new URL('../code-block-e2e/fixture.tsx', import.meta.url).pathname,
    ],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"test"' },
})
const artifactDir = new URL(
    '../../../docs/verification/artifacts/',
    import.meta.url
)
await mkdir(artifactDir, { recursive: true })
const results: Array<Record<string, unknown>> = []
const liveResults: Array<Record<string, unknown>> = []
const skipped: Array<{ browser: string; reason: string }> = []
const baseUrl = process.argv[2] ? new URL(process.argv[2]) : null
if (baseUrl && !['localhost', '127.0.0.1'].includes(baseUrl.hostname)) {
    throw new Error(
        'Live checks are restricted to the local development server'
    )
}

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    let browser
    try {
        browser = await engine.launch()
    } catch (error) {
        skipped.push({
            browser: name,
            reason:
                error instanceof Error
                    ? error.message.split('\n')[0]!
                    : 'Launch failed',
        })
        continue
    }
    try {
        for (const width of [320, 390, 1280])
            for (const locale of ['ko', 'en'])
                for (const dark of [false, true])
                    for (const scale of [1, 1.25, 1.5, 2]) {
                        const page = await browser.newPage({
                            viewport: { width, height: 900 },
                        })
                        const errors: string[] = []
                        page.on('pageerror', (error) =>
                            errors.push(error.message)
                        )
                        try {
                            await page.setContent(
                                `<html lang="${locale}" class="${dark ? 'dark' : ''}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}:root{--primary:#ff7012;--primary-fixed:#ffb88c;--hf-bg-deep:#171717;--font-mono:monospace;--font-display:sans-serif;--hf-accent-cold:#8ed0db;--hf-accent-warm:#f9b883;font-size:${16 * scale}px}body{margin:16px;background:${dark ? '#111' : '#fff'}}.mdx-wrapper{max-width:900px;margin:auto;min-width:0}${css}</style></head><body><div id="fixture"></div></body></html>`
                            )
                            await page.evaluate(
                                ({ code, remoteHtml }) => {
                                    window.codeFixture = { code, remoteHtml }
                                    Object.defineProperty(
                                        navigator,
                                        'clipboard',
                                        {
                                            configurable: true,
                                            value: {
                                                writeText: async (
                                                    text: string
                                                ) => {
                                                    window.copiedCode = text
                                                },
                                            },
                                        }
                                    )
                                },
                                { code, remoteHtml }
                            )
                            await page.addScriptTag({
                                content: output.outputFiles![0]!.text,
                            })
                            await page
                                .locator('[data-testid="local"] summary')
                                .waitFor()
                            for (const source of ['local', 'shiki', 'remote']) {
                                const frame = page.locator(
                                    `[data-testid="${source}"] .mdx-code-frame`
                                )
                                const metrics = await frame.evaluate((el) => {
                                    const summary = el.querySelector('summary')!
                                    const copy = el.querySelector('button')!
                                    const text = Array.from(
                                        summary.querySelectorAll(
                                            '[data-code-locale]'
                                        )
                                    ).find(
                                        (span) =>
                                            getComputedStyle(span).display !==
                                            'none'
                                    )!
                                    const caption = el.querySelector(
                                        '.mdx-code-disclosure__language'
                                    )!
                                    const count = text
                                        .querySelector('small')!
                                        .getBoundingClientRect()
                                    const r = text.getBoundingClientRect(),
                                        c = caption.getBoundingClientRect(),
                                        f = el.getBoundingClientRect()
                                    const pre =
                                        el.querySelector('.mdx-code-preview')!
                                    return {
                                        clippedFooter:
                                            r.right > f.right - 4 ||
                                            r.left < f.left,
                                        captionOverlap:
                                            Math.max(r.right, count.right) >
                                                c.left - 4 &&
                                            r.bottom > c.top &&
                                            r.top < c.bottom,
                                        textRight: r.right,
                                        frameRight: f.right,
                                        summaryHeight:
                                            summary.getBoundingClientRect()
                                                .height,
                                        copyHeight:
                                            copy.getBoundingClientRect().height,
                                        copyName:
                                            copy.getAttribute('aria-label'),
                                        codeScrolls:
                                            pre.scrollWidth > pre.clientWidth,
                                        pageOverflow:
                                            document.documentElement
                                                .scrollWidth >
                                            window.innerWidth,
                                    }
                                })
                                const summary = frame.locator('summary')
                                await summary.focus()
                                await page.keyboard.press('Enter')
                                const opens =
                                    (await frame
                                        .locator('details')
                                        .getAttribute('open')) !== null
                                const expandedCodeVisible = await frame
                                    .locator('details pre')
                                    .isVisible()
                                await page.keyboard.press('Space')
                                const closes =
                                    (await frame
                                        .locator('details')
                                        .getAttribute('open')) === null
                                const previewVisible = await frame
                                    .locator('.mdx-code-preview')
                                    .isVisible()
                                await frame.locator('button').click()
                                const copied = await page.evaluate(
                                    () => window.copiedCode
                                )
                                const wholeCopy =
                                    copied ===
                                    (source === 'remote' ? code.trim() : code)
                                await page.emulateMedia({
                                    reducedMotion: 'reduce',
                                })
                                const reducedMotion = await summary.evaluate(
                                    (el) =>
                                        getComputedStyle(el)
                                            .transitionDuration === '0s'
                                )
                                results.push({
                                    browser: name,
                                    width,
                                    locale,
                                    theme: dark ? 'dark' : 'light',
                                    rootFontScale: scale,
                                    source,
                                    ...metrics,
                                    opens,
                                    closes,
                                    expandedCodeVisible,
                                    previewVisible,
                                    wholeCopy,
                                    reducedMotion,
                                    errors: [...errors],
                                })
                                if (
                                    name === 'chromium' &&
                                    width === 320 &&
                                    locale === 'en' &&
                                    !dark &&
                                    scale === 2 &&
                                    source === 'remote'
                                ) {
                                    await frame.screenshot({
                                        path: new URL(
                                            '2026-10-10-code-footer-200-percent-fixed.png',
                                            artifactDir
                                        ).pathname,
                                    })
                                }
                            }
                        } finally {
                            await page.close()
                        }
                    }
        if (baseUrl && name === 'chromium') {
            for (const width of [320, 390, 1280])
                for (const locale of ['ko', 'en'])
                    for (const dark of [false, true]) {
                        const page = await browser.newPage({
                            viewport: { width, height: 900 },
                        })
                        const errors: string[] = []
                        page.on('pageerror', (error) =>
                            errors.push(error.message)
                        )
                        try {
                            await page.addInitScript(() => {
                                Object.defineProperty(navigator, 'clipboard', {
                                    configurable: true,
                                    value: {
                                        writeText: async (text: string) => {
                                            window.copiedCode = text
                                        },
                                    },
                                })
                            })
                            const response = await page.goto(
                                new URL(
                                    `/${locale}/docs/category/be/node-js/stream-backpressure-diagnosis`,
                                    baseUrl
                                ).href
                            )
                            await page.evaluate(
                                (dark) =>
                                    document.documentElement.classList.toggle(
                                        'dark',
                                        dark
                                    ),
                                dark
                            )
                            const frame = page
                                .locator('.mdx-code-frame--collapsible')
                                .first()
                            const summary = frame.locator('summary')
                            await summary.focus()
                            await page.keyboard.press('Enter')
                            const opens =
                                (await frame
                                    .locator('details')
                                    .getAttribute('open')) !== null
                            const fullCode = await frame
                                .locator('details pre code')
                                .textContent()
                            await page.keyboard.press('Space')
                            const closes =
                                (await frame
                                    .locator('details')
                                    .getAttribute('open')) === null
                            await frame.locator('button').click()
                            await page.waitForFunction(
                                () =>
                                    document
                                        .querySelector(
                                            '.mdx-code-frame--collapsible button'
                                        )
                                        ?.getAttribute('data-copy-state') ===
                                    'copied'
                            )
                            const copied = await page.evaluate(
                                () => window.copiedCode
                            )
                            const pageOverflow = await page.evaluate(
                                () =>
                                    document.documentElement.scrollWidth >
                                    window.innerWidth
                            )
                            liveResults.push({
                                browser: name,
                                width,
                                locale,
                                theme: dark ? 'dark' : 'light',
                                status: response?.status(),
                                opens,
                                closes,
                                wholeCopy: copied === fullCode,
                                pageOverflow,
                                errors,
                            })
                        } finally {
                            await page.close()
                        }
                    }
        }
    } finally {
        await browser.close()
    }
}

const report = {
    checkedOn: '2026-10-10',
    timezone: 'Asia/Seoul',
    commit,
    cssSha256: createHash('sha256').update(css).digest('hex'),
    scope: 'Current worktree CSS and components; root-font scaling is not browser zoom; clipboard mocked; optional development pages include the current worktree',
    results,
    liveResults,
    skipped,
}
await writeFile(
    new URL('2026-10-10-code-block-usability-fixed.json', artifactDir),
    JSON.stringify(report, null, 2) + '\n'
)
console.log(
    JSON.stringify(
        {
            cases: results.length,
            skipped,
            clippedFooter: results.filter((r) => r.clippedFooter).length,
            captionOverlap: results.filter((r) => r.captionOverlap).length,
            pageOverflow: results.filter((r) => r.pageOverflow).length,
            englishCopyInKorean: results.filter(
                (r) => r.locale === 'en' && r.copyName === '코드 복사'
            ).length,
            functionalFailures: results.filter(
                (r) =>
                    !r.opens ||
                    !r.closes ||
                    !r.expandedCodeVisible ||
                    !r.previewVisible ||
                    !r.wholeCopy ||
                    !r.reducedMotion ||
                    (r.errors as string[]).length
            ).length,
            liveCases: liveResults.length,
            liveFailures: liveResults.filter(
                (r) =>
                    !r.opens ||
                    !r.closes ||
                    !r.wholeCopy ||
                    r.pageOverflow ||
                    (r.errors as string[]).length
            ).length,
        },
        null,
        2
    )
)

if (
    skipped.length ||
    results.some(
        (r) =>
            r.clippedFooter ||
            r.captionOverlap ||
            r.pageOverflow ||
            !r.opens ||
            !r.closes ||
            !r.expandedCodeVisible ||
            !r.previewVisible ||
            !r.wholeCopy ||
            !r.reducedMotion ||
            (r.locale === 'en' && r.copyName !== 'Copy code') ||
            (r.errors as string[]).length
    ) ||
    liveResults.some(
        (r) =>
            r.status !== 200 ||
            !r.opens ||
            !r.closes ||
            !r.wholeCopy ||
            r.pageOverflow ||
            (r.errors as string[]).length
    )
) {
    process.exitCode = 1
}

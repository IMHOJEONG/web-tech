import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { NextIntlClientProvider } from 'next-intl'
import { resolveDocsSearchPageState } from './docs-search-page-state.ts'
import type { DocsEmptyPage } from '../widgets/docs-index/ui/docs-empty-page'

test('empty pages render translated landmarks and recovery links', async (t) => {
    const require = createRequire(import.meta.url)
    const requireIntl = createRequire(require.resolve('next-intl/navigation'))
    // Compile TSX and aliases; render the actual widget, translations and i18n links.
    const result = await build({
        entryPoints: [
            fileURLToPath(
                new URL(
                    '../widgets/docs-index/ui/docs-empty-page.tsx',
                    import.meta.url
                )
            ),
        ],
        absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        plugins: [
            {
                name: 'bundle-intl-navigation',
                setup(builder) {
                    // Next's extensionless imports need bundler resolution outside Next.js.
                    builder.onResolve(
                        { filter: /^next-intl\/navigation$/ },
                        () => ({
                            path: require.resolve('next-intl/navigation'),
                            external: false,
                        })
                    )
                },
            },
        ],
        jsx: 'automatic',
        write: false,
    })
    const compiled = { exports: {} as { DocsEmptyPage: typeof DocsEmptyPage } }
    new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
        (id: string) =>
            id === 'use-intl' || id.startsWith('use-intl/')
                ? requireIntl(id)
                : require(id),
        compiled,
        compiled.exports
    )

    for (const locale of ['ko', 'en']) {
        const messages = JSON.parse(
            readFileSync(
                new URL(`../shared/message/${locale}.json`, import.meta.url),
                'utf8'
            )
        )
        for (const query of [undefined, '   ', 'missing-document']) {
            await t.test(
                `${locale}: ${query === undefined ? 'no documents' : JSON.stringify(query)}`,
                () => {
                    const state = resolveDocsSearchPageState({
                        query,
                        docs: [],
                        searchResults: [],
                    })
                    assert.ok(
                        state.mode === 'empty-all-docs' ||
                            state.mode === 'empty-search'
                    )
                    // next-intl requires children in the props type of createElement.
                    const markup = renderToStaticMarkup(
                        // eslint-disable-next-line react/no-children-prop
                        createElement(NextIntlClientProvider, {
                            locale,
                            messages,
                            timeZone: 'UTC',
                            children: createElement(
                                compiled.exports.DocsEmptyPage,
                                { state, recommendations: ['React', 'UI & UX'] }
                            ),
                        })
                    )
                    assert.equal((markup.match(/<main\b/g) ?? []).length, 1)
                    assert.equal((markup.match(/<h1\b/g) ?? []).length, 1)
                    assert.match(markup, /id="main-content"/)
                    assert.match(markup, /tabindex="-1"/)
                    const searching = state.mode === 'empty-search'
                    assert.ok(
                        markup.includes(
                            searching
                                ? messages.search.empty.resultHeading
                                : messages.search.empty.allHeading
                        )
                    )
                    assert.ok(
                        markup.includes(
                            `href="/${locale}/${searching ? 'docs' : 'feed'}"`
                        )
                    )
                    if (searching) {
                        assert.ok(
                            markup.includes(
                                `href="/${locale}/docs?q=UI%20%26%20UX"`
                            )
                        )
                        assert.ok(
                            markup.includes(
                                messages.search.empty.recommendations
                            )
                        )
                    } else {
                        assert.ok(!markup.includes('docs?q='))
                    }
                    if (locale === 'en') assert.doesNotMatch(markup, /[가-힣]/)
                }
            )
        }
    }
})

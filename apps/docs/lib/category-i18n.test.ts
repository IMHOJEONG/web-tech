import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'
import { createTranslator } from 'next-intl'

test('every taxonomy summary has ko/en translations without changing routes', async () => {
    const result = await build({
        entryPoints: ['entities/category/model/category.ts'],
        absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
    })
    const compiled = {
        exports: {} as {
            categoryTree: readonly {
                url: string
                summaryKey: string
                sub: readonly { url: string; summaryKey: string }[]
            }[]
            getSubCategories: (
                main: string
            ) => { url: string; summaryKey: string }[]
        },
    }
    new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
        createRequire(import.meta.url),
        compiled,
        compiled.exports
    )
    const { categoryTree, getSubCategories } = compiled.exports
    for (const locale of ['ko', 'en']) {
        const messages = JSON.parse(
            await readFile(
                new URL(`../shared/message/${locale}.json`, import.meta.url),
                'utf8'
            )
        )
        const t = createTranslator({ locale, messages, namespace: 'category' })
        for (const category of categoryTree) {
            for (const item of [category, ...category.sub]) {
                const key = `summaries.${item.summaryKey}`
                assert.equal(t.has(key), true, `${locale}: ${key}`)
                assert.ok(t(key).length > 10)
                if (locale === 'en') assert.doesNotMatch(t(key), /[가-힣]/)
            }
            assert.deepEqual(
                getSubCategories(category.url).map((item) => item.url),
                category.sub.map(
                    (topic) => `/category/${category.url}/${topic.url}`
                )
            )
        }
        for (const key of [
            'index.title',
            'main.title',
            'sub.title',
            'latestUpdate',
            'emptyLatest',
        ]) {
            assert.equal(t.has(key), true)
        }
        if (locale === 'en') {
            assert.equal(t('documentCount', { count: 0 }), '0 documents')
            assert.equal(t('documentCount', { count: 1 }), '1 document')
            assert.equal(t('documentCount', { count: 2 }), '2 documents')
        } else {
            assert.equal(t('documentCount', { count: 1 }), '문서 1개')
        }
    }
})

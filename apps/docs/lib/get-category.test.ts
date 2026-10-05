import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'

test('category loaders validate the real taxonomy before calling glob', async (t) => {
    const result = await build({
        stdin: {
            contents: `
                export * from './lib/get-category';
                export { categoryTree, getCategoryTopic } from './entities/category/model/category';
            `,
            resolveDir: fileURLToPath(new URL('..', import.meta.url)),
            loader: 'ts',
        },
        absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        packages: 'external',
        write: false,
    })
    const require = createRequire(import.meta.url)
    const patterns: string[] = []
    const compiled = {
        exports: {} as {
            categoryTree: readonly {
                url: string
                sub: readonly { url: string }[]
            }[]
            getCategoryTopic: (main: string, sub: string) => unknown
            getSubCategoryData: (
                main: string,
                sub: string
            ) => Promise<unknown[]>
            getCategoryData: (main: string, sub: string) => Promise<unknown[]>
            getSubCategoryOverview: (main: string) => Promise<unknown[]>
            getMainCategoryOverview: () => Promise<unknown[]>
        },
    }
    // Exercise the real route-to-pattern code, but never search the filesystem.
    const mockRequire = (id: string) =>
        id === 'fast-glob'
            ? async (pattern: string) => {
                  patterns.push(pattern)
                  return []
              }
            : require(id)
    new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(
        mockRequire,
        compiled,
        compiled.exports
    )
    const api = compiled.exports

    await t.test(
        'every configured pair works for both public loaders',
        async () => {
            for (const category of api.categoryTree) {
                for (const topic of category.sub) {
                    patterns.length = 0
                    assert.ok(api.getCategoryTopic(category.url, topic.url))
                    assert.deepEqual(
                        await api.getSubCategoryData(category.url, topic.url),
                        []
                    )
                    assert.deepEqual(
                        await api.getCategoryData(category.url, topic.url),
                        []
                    )
                    assert.deepEqual(patterns, [
                        `category/${category.url}/${topic.url}/*.{md,mdx}`,
                        `category/${category.url}/${topic.url}/*.{md,mdx}`,
                    ])
                }
            }
        }
    )

    const invalidPairs = [
        ['unknown', 'react'],
        ['fe', 'node-js'],
        ['be', 'react'],
        ['FE', 'react'],
        ['fe', 'React'],
        ['', 'react'],
        ['fe', ''],
        ['fe', '{react,browser}'],
        ['{fe,be}', 'react'],
        ['fe', '*'],
        ['fe', '**'],
        ['fe', 'r?act'],
        ['fe', '[react]'],
        ['fe', '@(react|browser)'],
        ['fe', '../react'],
        ['../fe', 'react'],
        ['fe', 'react/browser'],
        ['fe', 'react\\browser'],
        ['fe', '%7Breact,browser%7D'],
        ['fe', 'react\0'],
        ['fe', ' react '],
        ['fe', '{'.repeat(10000)],
    ] as const

    await t.test('invalid pairs never reach glob', async () => {
        patterns.length = 0
        for (const [main, sub] of invalidPairs) {
            assert.equal(api.getCategoryTopic(main, sub), null)
            assert.deepEqual(await api.getSubCategoryData(main, sub), [])
            assert.deepEqual(await api.getCategoryData(main, sub), [])
        }
        assert.deepEqual(patterns, [])
    })

    await t.test('overview paths only use configured categories', async () => {
        patterns.length = 0
        assert.deepEqual(await api.getSubCategoryOverview('{fe,be}'), [])
        assert.deepEqual(patterns, [])
        const overview = await api.getMainCategoryOverview()
        assert.equal(overview.length, api.categoryTree.length)
        assert.deepEqual(
            [...patterns].sort(),
            api.categoryTree
                .flatMap((category) =>
                    category.sub.map(
                        (topic) =>
                            `category/${category.url}/${topic.url}/*.{md,mdx}`
                    )
                )
                .sort()
        )
    })
})

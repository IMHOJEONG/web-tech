import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'
import { build } from 'esbuild'

test('category loaders validate the real taxonomy before reading directories', async (t) => {
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
    const directories: string[] = []
    let readError: Error | undefined
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
    // Exercise the real loader and walker without reading content directories.
    const mockRequire = (id: string) =>
        id === 'node:fs' || id === 'fs'
            ? {
                  ...require(id),
                  lstatSync: () => ({ isDirectory: () => true }),
                  readdirSync: (directory: string) => {
                      directories.push(directory)
                      if (readError) throw readError
                      return []
                  },
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
                    directories.length = 0
                    assert.ok(api.getCategoryTopic(category.url, topic.url))
                    assert.deepEqual(
                        await api.getSubCategoryData(category.url, topic.url),
                        []
                    )
                    assert.deepEqual(
                        await api.getCategoryData(category.url, topic.url),
                        []
                    )
                    assert.deepEqual(directories, [
                        path.resolve('category', category.url, topic.url),
                        path.resolve('category', category.url, topic.url),
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

    await t.test('invalid pairs never reach directory reads', async () => {
        directories.length = 0
        for (const [main, sub] of invalidPairs) {
            assert.equal(api.getCategoryTopic(main, sub), null)
            assert.deepEqual(await api.getSubCategoryData(main, sub), [])
            assert.deepEqual(await api.getCategoryData(main, sub), [])
        }
        assert.deepEqual(directories, [])
    })

    await t.test('overview paths only use configured categories', async () => {
        directories.length = 0
        assert.deepEqual(await api.getSubCategoryOverview('{fe,be}'), [])
        assert.deepEqual(directories, [])
        const overview = await api.getMainCategoryOverview()
        assert.equal(overview.length, api.categoryTree.length)
        assert.deepEqual(
            [...directories].sort(),
            api.categoryTree
                .flatMap((category) =>
                    category.sub.map((topic) =>
                        path.resolve('category', category.url, topic.url)
                    )
                )
                .sort()
        )
    })

    await t.test(
        'filesystem failures are not cached as empty content',
        async () => {
            readError = Object.assign(new Error('fixture permission failure'), {
                code: 'EACCES',
            })
            const category = api.categoryTree[0]!
            await assert.rejects(
                api.getSubCategoryData(category.url, category.sub[0]!.url),
                (error) => error === readError
            )
            readError = undefined
        }
    )
})

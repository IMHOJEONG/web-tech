import assert from 'node:assert/strict'
import test from 'node:test'
import { getDocChannel } from './get-doc-channel.ts'
import { inferSearchSection } from './local-search-index.ts'

const cases = [
    ['web/browser', 'Web', 'web'],
    ['/web/browser.mdx', 'Web', 'web'],
    ['ui-ux/dialog', 'UI/UX', 'uiux'],
    ['mobile/touch', 'Mobile', 'mobile'],
    ['category/fe/react/article', 'Web', 'web'],
    ['data/v8/bytecode', 'Web', 'web'],
    ['data/shadcn/dialog', 'UI/UX', 'uiux'],
    ['apps/docs/data/shadcn/dialog', 'UI/UX', 'uiux'],
    ['category/mobile/ios/article', 'Mobile', 'mobile'],
    ['category/fe/react-native/article', 'Mobile', 'mobile'],
    ['category/be/node/article', 'Backend', 'other'],
    ['category/infra/containers/article', 'Infrastructure', 'other'],
    ['category/computer-science/os/article', 'Computer Science', 'other'],
    ['feed/web', 'Docs', 'other'],
    ['websocket/article', 'Docs', 'other'],
    ['notes/web/article', 'Docs', 'other'],
    ['feed/apps/docs/web/article', 'Docs', 'other'],
    ['/docs/feed/apps/docs/web/article', 'Docs', 'other'],
    ['web/android/article', 'Web', 'web'],
    ['apps\\docs\\data\\v8\\bytecode.md', 'Web', 'web'],
    [
        '/Users/example/project/apps/docs/category/fe/react/article.md',
        'Web',
        'web',
    ],
    ['/ko/docs/mobile/touch/', 'Mobile', 'mobile'],
    ['/en/docs/ui-ux/dialog.html', 'UI/UX', 'uiux'],
] as const

for (const [path, section, channel] of cases) {
    test(`search and channel agree for ${path}`, () => {
        assert.equal(inferSearchSection(path), section)
        assert.equal(getDocChannel(path), channel)
    })
}

test('canonical metadata wins over a conflicting storage filename', () => {
    assert.equal(
        getDocChannel({
            markdownPath: 'mobile/touch',
            fileName: 'category/fe/react/touch',
        }),
        'mobile'
    )
    assert.equal(
        getDocChannel({
            markdownPath: 'feed/note',
            fileName: 'data/v8/note',
        }),
        'other'
    )
    assert.equal(getDocChannel(null), 'other')
    assert.equal(getDocChannel(), 'other')
    assert.equal(
        getDocChannel({
            href: '/docs/ui-ux/dialog',
            fileName: 'remote/dialog',
        }),
        'uiux'
    )
    assert.equal(
        getDocChannel({ markdownPath: ' ', path: 'web/browser' }),
        'web'
    )
})

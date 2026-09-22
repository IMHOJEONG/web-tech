import assert from 'node:assert/strict'
import test from 'node:test'
import { APP_NAVIGATION, getActiveNavigationKey } from './app-navigation.ts'

test('all shell menus share unique keys and destinations', () => {
    assert.equal(new Set(APP_NAVIGATION.map((item) => item.key)).size, 5)
    assert.equal(new Set(APP_NAVIGATION.map((item) => item.href)).size, 5)
})

const sections = {
    feed: [
        '/',
        '/feed',
        '/docs',
        '/docs/feed/pna',
        '/docs/category/be/node-js/guide',
        '/docs/unknown',
    ],
    web: [
        '/web',
        '/web/topic',
        '/category/fe',
        '/category/fe/react/guide',
        '/docs/web/runtime',
        '/docs/category/fe/react/guide',
    ],
    mobile: ['/mobile', '/docs/mobile/touch-targets'],
    uiux: ['/ui-ux', '/docs/ui-ux/focus-management'],
    about: ['/about'],
} as const

for (const [key, paths] of Object.entries(sections)) {
    test(`resolves ${key} for hubs, details and locale variants`, () => {
        for (const path of paths) {
            for (const locale of ['', '/ko', '/en']) {
                const localized = `${locale}${path}`
                assert.equal(getActiveNavigationKey(localized), key, localized)
                assert.equal(
                    getActiveNavigationKey(
                        `${localized.replace(/\/+$/, '')}/?q=react#content`
                    ),
                    key
                )
            }
        }
    })
}

test('does not match partial segments or guess a section from the article slug', () => {
    for (const path of [
        undefined,
        null,
        '',
        'web',
        '//example.com/web',
        '/webinar',
        '/mobile-app',
        '/ui-ux-notes',
        '/about-us',
        '/docs-old',
        '/category/feature',
        '/korea/web',
    ]) {
        assert.equal(getActiveNavigationKey(path), null, String(path))
    }
    assert.equal(getActiveNavigationKey('/docs/category/feature/test'), 'feed')
    assert.equal(getActiveNavigationKey('/docs/feed/web'), 'feed')
    assert.equal(getActiveNavigationKey('/docs/mobile/web'), 'mobile')
})

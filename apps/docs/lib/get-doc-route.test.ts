import assert from 'node:assert/strict'
import test from 'node:test'
import {
    getDocHref,
    getDocRoutePath,
    isDocRouteMatch,
    normalizeRequestedDocRoutePath,
    shouldRedirectToCanonicalDocRoute,
} from './get-doc-route.ts'

test('normalizes requested doc route path and collapses duplicate leaf', () => {
    assert.equal(normalizeRequestedDocRoutePath('/feed/pna/pna/'), 'feed/pna')
    assert.equal(normalizeRequestedDocRoutePath('web/rendering-pipeline.mdx'), 'web/rendering-pipeline')
    assert.equal(normalizeRequestedDocRoutePath(undefined), null)
})

test('uses markdownPath as canonical doc route source', () => {
    const source = {
        slug: 'pna',
        markdownPath: 'feed/pna',
        fileName: 'remote/pna',
    }

    assert.equal(getDocRoutePath(source), 'feed/pna')
    assert.equal(getDocHref(source), '/docs/feed/pna')
})

test('maps local data paths to channel routes', () => {
    assert.equal(
        getDocRoutePath({
            slug: 'bytecode',
            fileName: 'data/v8/bytecode',
        }),
        'web/bytecode'
    )

    assert.equal(
        getDocRoutePath({
            slug: 'blocked-aria-hidden',
            fileName: 'data/shadcn/blocked-aria-hidden',
        }),
        'ui-ux/blocked-aria-hidden'
    )
})

test('matches legacy aliases but redirects them to canonical routes', () => {
    const source = {
        slug: 'pna',
        markdownPath: 'feed/pna',
        fileName: 'feed/pna',
        path: 'feed/pna/pna',
    }

    assert.equal(isDocRouteMatch(source, 'pna'), true)
    assert.equal(isDocRouteMatch(source, 'feed/pna/pna'), true)
    assert.equal(shouldRedirectToCanonicalDocRoute(source, 'feed/pna/pna'), true)
    assert.equal(shouldRedirectToCanonicalDocRoute(source, 'feed/pna'), false)
})

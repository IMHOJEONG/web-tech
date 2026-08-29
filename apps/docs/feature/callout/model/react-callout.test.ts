import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    getCalloutVariantFromChildren,
    stripCalloutMarkerFromNode,
} from './react-callout.ts'

test('getCalloutVariantFromChildren detects markers after leading whitespace nodes', () => {
    const children = [
        '\n',
        createElement('p', { key: 'content' }, [
            '[!NOTE]\n',
            '이 글은 production 적용 가이드가 아닙니다.',
        ]),
    ]

    assert.equal(getCalloutVariantFromChildren(children), 'note')
})

test('stripCalloutMarkerFromNode removes marker without dropping following content', () => {
    const children = [
        '\n',
        createElement('p', { key: 'content' }, [
            '[!NOTE]\n',
            '이 글은 production 적용 가이드가 아닙니다.',
        ]),
    ]

    const result = stripCalloutMarkerFromNode(children)
    const markup = renderToStaticMarkup(createElement('div', null, result.node))

    assert.equal(result.stripped, true)
    assert.doesNotMatch(markup, /\[!NOTE\]/)
    assert.match(markup, /이 글은 production 적용 가이드가 아닙니다\./)
})

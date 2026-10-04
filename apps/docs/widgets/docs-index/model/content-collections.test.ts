import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { loadLocalSearchIndex } from '../../../lib/local-search-index.ts'
import {
    CONTENT_COLLECTIONS,
    getContentCollections,
    getContentTags,
} from './content-collections.ts'
import {
    applyDocsIndexControls,
    getDocsIndexHref,
    resolveDocsIndexControls,
} from './docs-index-controls.ts'
import type { SearchData } from '../../../lib/get-search-data'

function doc(href: string, tags: string[] = []): SearchData {
    return {
        id: href,
        slug: href,
        fileName: href,
        href,
        tags,
        content: '',
        section: 'Web',
        contentSource: 'local',
    }
}

test('tag counts normalize case and Unicode and count each document once', () => {
    assert.deepEqual(
        getContentTags([
            doc('/a', ['React', 'react', 'Ｒｅａｃｔ']),
            doc('/b', ['react', 'aria']),
        ]),
        [
            { tag: 'react', count: 2 },
            { tag: 'aria', count: 1 },
        ]
    )
})

test('tags and collections compose with section and keep query and pagination', () => {
    const controls = resolveDocsIndexControls({
        tag: ' JAVASCRIPT ',
        collection: 'browser-runtime',
    })
    const docs = [
        doc('/docs/web/bytecode', ['JavaScript']),
        doc('/docs/web/javascript-event-loop-runtime', ['javascript']),
        doc('/other', ['javascript']),
    ]
    assert.equal(applyDocsIndexControls(docs, controls).length, 2)
    assert.equal(
        applyDocsIndexControls(docs, { ...controls, section: 'backend' })
            .length,
        0
    )
    assert.equal(
        applyDocsIndexControls(docs, { ...controls, collection: 'missing' })
            .length,
        0
    )
    assert.equal(
        getDocsIndexHref({ controls, keyword: 'runtime', page: 2 }),
        '/docs?q=runtime&page=2&tag=javascript&collection=browser-runtime'
    )
    assert.equal(
        getDocsIndexHref({ controls, overrides: { tag: '', collection: '' } }),
        '/docs'
    )
})

test('collections retain editorial order and omit unavailable articles', () => {
    const docs = [
        doc('/docs/web/javascript-event-loop-runtime'),
        doc('/docs/web/bytecode'),
    ]
    assert.deepEqual(
        getContentCollections(docs)[0]?.docs.map((item) => item.href),
        ['/docs/web/bytecode', '/docs/web/javascript-event-loop-runtime']
    )
    assert.deepEqual(getContentCollections(docs.slice(0, 1)), [])
})

test('every current collection targets distinct published canonical documents', async () => {
    const docs = await loadLocalSearchIndex(
        path.resolve(import.meta.dirname, '../../..')
    )
    const hrefs = new Set(docs.map((item) => item.href))
    assert.equal(
        new Set(CONTENT_COLLECTIONS.map(({ id }) => id)).size,
        CONTENT_COLLECTIONS.length
    )
    for (const collection of CONTENT_COLLECTIONS) {
        assert.ok(collection.hrefs.length >= 2)
        assert.equal(new Set(collection.hrefs).size, collection.hrefs.length)
        for (const href of collection.hrefs)
            assert.ok(
                hrefs.has(href),
                `${collection.id}: ${href} must be published`
            )
    }
})

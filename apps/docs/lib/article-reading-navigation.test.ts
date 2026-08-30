import assert from 'node:assert/strict'
import test from 'node:test'
import type { ArticleReadingNavigationDoc } from './article-reading-navigation.ts'
import { buildArticleReadingNavigation } from './article-reading-navigation.ts'

const newestDoc: ArticleReadingNavigationDoc = {
    title: 'Newest',
    slug: 'newest',
    fileName: 'web/newest',
    date: '2026-08-30',
}

const currentDoc: ArticleReadingNavigationDoc = {
    title: 'Current',
    slug: 'current',
    fileName: 'web/current',
    date: '2026-08-29',
    updatedAt: '2026-08-30',
}

const oldestDoc: ArticleReadingNavigationDoc = {
    title: 'Oldest',
    slug: 'oldest',
    fileName: 'web/oldest',
    date: '2026-08-28',
}

const docs: ArticleReadingNavigationDoc[] = [newestDoc, currentDoc, oldestDoc]

test('buildArticleReadingNavigation returns previous older doc and next newer doc', () => {
    const navigation = buildArticleReadingNavigation(docs, currentDoc)

    assert.equal(navigation.lastUpdated, '2026-08-30')
    assert.equal(navigation.previous?.href, '/docs/web/oldest')
    assert.equal(navigation.previous?.title, 'Oldest')
    assert.equal(navigation.next?.href, '/docs/web/newest')
    assert.equal(navigation.next?.title, 'Newest')
})

test('buildArticleReadingNavigation deduplicates docs by canonical href', () => {
    const navigation = buildArticleReadingNavigation(
        [
            newestDoc,
            currentDoc,
            {
                ...currentDoc,
                title: 'Duplicated current',
            },
            oldestDoc,
        ],
        currentDoc
    )

    assert.equal(navigation.previous?.href, '/docs/web/oldest')
    assert.equal(navigation.next?.href, '/docs/web/newest')
})

test('buildArticleReadingNavigation falls back to date when updatedAt is missing', () => {
    const navigation = buildArticleReadingNavigation(docs, oldestDoc)

    assert.equal(navigation.lastUpdated, '2026-08-28')
    assert.equal(navigation.previous, null)
    assert.equal(navigation.next?.href, '/docs/web/current')
})

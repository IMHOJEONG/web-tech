import assert from 'node:assert/strict'
import test from 'node:test'
import type { ArticleRelatedDocument } from './article-related-documents.ts'
import { buildArticleRelatedDocuments } from './article-related-documents.ts'

const currentDoc: ArticleRelatedDocument = {
    title: 'Server Component Boundary',
    slug: 'server-component-boundary',
    fileName: 'category/fe/react/server-component-boundary',
    date: '2026-08-30',
    tags: ['react', 'nextjs', 'architecture'],
    topicLabel: 'REACT',
    contentSource: 'local',
}

const sameTagsDoc: ArticleRelatedDocument = {
    title: 'React Rendering Cost',
    slug: 'react-rendering-cost',
    fileName: 'category/fe/react/react-rendering-cost',
    date: '2026-08-29',
    tags: ['react', 'performance'],
    topicLabel: 'REACT',
    contentSource: 'local',
}

const sameSectionDoc: ArticleRelatedDocument = {
    title: 'Next App Router',
    slug: 'next-app-router',
    fileName: 'category/fe/nextjs/next-app-router',
    date: '2026-08-28',
    tags: ['routing'],
    topicLabel: 'NEXTJS',
    contentSource: 'local',
}

const unrelatedDoc: ArticleRelatedDocument = {
    title: 'Postgres Indexing',
    slug: 'postgres-indexing',
    fileName: 'category/be/database/postgres-indexing',
    date: '2026-08-27',
    tags: ['database'],
    topicLabel: 'DATABASE',
    contentSource: 'local',
}

test('buildArticleRelatedDocuments prefers docs with shared tags', () => {
    const related = buildArticleRelatedDocuments(
        [sameSectionDoc, sameTagsDoc, unrelatedDoc, currentDoc],
        currentDoc
    )

    assert.equal(
        related[0]?.href,
        '/docs/category/fe/react/react-rendering-cost'
    )
    assert.equal(related[0]?.title, 'React Rendering Cost')
})

test('buildArticleRelatedDocuments excludes current doc and unrelated docs', () => {
    const related = buildArticleRelatedDocuments(
        [currentDoc, unrelatedDoc],
        currentDoc
    )

    assert.deepEqual(related, [])
})

test('buildArticleRelatedDocuments deduplicates candidates by canonical href', () => {
    const related = buildArticleRelatedDocuments(
        [
            sameTagsDoc,
            {
                ...sameTagsDoc,
                title: 'Duplicated React Rendering Cost',
            },
        ],
        currentDoc
    )

    assert.equal(related.length, 1)
    assert.equal(related[0]?.title, 'React Rendering Cost')
})

test('buildArticleRelatedDocuments limits result count', () => {
    const related = buildArticleRelatedDocuments(
        [
            sameTagsDoc,
            {
                title: 'React State Boundary',
                slug: 'react-state-boundary',
                fileName: 'category/fe/react/react-state-boundary',
                date: '2026-08-26',
                tags: ['react'],
                topicLabel: 'REACT',
            },
            sameSectionDoc,
        ],
        currentDoc,
        2
    )

    assert.equal(related.length, 2)
})

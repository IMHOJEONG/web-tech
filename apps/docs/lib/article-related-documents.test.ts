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

test('related document calculation leaves shared documents and tags unchanged', () => {
    const input = structuredClone([sameSectionDoc, sameTagsDoc, currentDoc])
    const before = structuredClone(input)
    for (const doc of input) {
        if (doc.tags) Object.freeze(doc.tags)
        Object.freeze(doc)
    }
    Object.freeze(input)
    const target = input[2]
    assert.ok(target)
    const related = buildArticleRelatedDocuments(input, target)
    assert.ok(related.length > 0)
    assert.deepEqual(input, before)
})

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

test('related documents match local data aliases and remote canonical paths without storage-name leakage', () => {
    for (const [legacy, canonical] of [
        ['data/v8', 'web'],
        ['data/shadcn', 'ui-ux'],
        ['mobile', 'mobile'],
    ]) {
        const current = {
            title: 'Current',
            slug: 'current',
            fileName: `${legacy}/current`,
        }
        const candidate = {
            title: 'Related',
            slug: 'next',
            markdownPath: `${canonical}/next`,
            fileName: 'remote/next',
        }
        const unrelated = {
            title: 'Other',
            slug: 'other',
            markdownPath: 'feed/other',
            fileName: `${legacy}/other`,
        }
        assert.deepEqual(
            buildArticleRelatedDocuments([candidate, unrelated], current).map(
                (doc) => doc.href
            ),
            [`/docs/${canonical}/next`]
        )
    }
})

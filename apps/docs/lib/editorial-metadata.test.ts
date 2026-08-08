import assert from 'node:assert/strict'
import test from 'node:test'
import {
    assertValidLocalDocFrontmatter,
    formatLocalDocFrontmatterIssues,
    isPublicDocStatus,
    normalizeLocalDocFrontmatter,
    normalizeRemoteEditorialMetadata,
    validateLocalDocFrontmatter,
} from './editorial-metadata.ts'

test('normalizes local doc frontmatter aliases', () => {
    const frontmatter = normalizeLocalDocFrontmatter({
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        summary: 'Summary',
        date: '2026-08-08',
        author: 'HoJeong Im',
        role: 'Web Engineer',
        readTime: '7',
        topic: 'WEB',
        tags: 'browser, rendering, browser',
        status: 'published',
    })

    assert.deepEqual(frontmatter, {
        id: undefined,
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        summary: 'Summary',
        date: '2026-08-08',
        thumbnail: null,
        updatedAt: undefined,
        authorName: 'HoJeong Im',
        authorRole: 'Web Engineer',
        readMinutes: 7,
        topicLabel: 'WEB',
        tags: ['browser', 'rendering'],
        status: 'published',
    })
})

test('published content requires summary and date', () => {
    const result = validateLocalDocFrontmatter({
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        thumbnail: null,
    })

    assert.equal(result.success, false)
    if (result.success) {
        return
    }

    assert.equal(
        formatLocalDocFrontmatterIssues(result.error.issues),
        'summary: Invalid input: expected string, received undefined; date: Invalid input: expected string, received undefined'
    )
})

test('draft content allows missing summary and date', () => {
    const result = validateLocalDocFrontmatter({
        title: 'Draft Note',
        slug: 'draft-note',
        thumbnail: null,
        status: 'draft',
    })

    assert.equal(result.success, true)
    assert.equal(isPublicDocStatus('draft'), false)
    assert.equal(isPublicDocStatus('published'), true)
})

test('assertValidLocalDocFrontmatter throws readable error', () => {
    assert.throws(
        () =>
            assertValidLocalDocFrontmatter('apps/docs/data/example.mdx', {
                title: 'Bad Slug',
                slug: 'Bad_Slug',
                summary: 'Summary',
                date: '2026-08-08',
                thumbnail: null,
            }),
        /Invalid frontmatter/
    )
})

test('normalizes remote editorial metadata aliases', () => {
    const metadata = normalizeRemoteEditorialMetadata({
        updated_at: '2026-08-08',
        author_name: 'HoJeong Im',
        author_role: 'Web Engineer',
        read_time: '5',
        topic_label: 'WEB',
        tag_list: ['browser', 'rendering'],
        status: 'published',
    })

    assert.deepEqual(metadata, {
        updatedAt: '2026-08-08',
        authorName: 'HoJeong Im',
        authorRole: 'Web Engineer',
        readMinutes: 5,
        topicLabel: 'WEB',
        tags: ['browser', 'rendering'],
        status: 'published',
    })
})

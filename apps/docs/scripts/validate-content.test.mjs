import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getFrontmatterIssues,
    isPositiveInteger,
    normalizeStatus,
    parseFrontmatter,
} from './validate-content.mjs'

test('parseFrontmatter parses scalar and array values', () => {
    const frontmatter = parseFrontmatter(`---
title: "Rendering Pipeline"
slug: rendering-pipeline
tags:
  - browser
  - rendering
status: published
---

Body
`)

    assert.deepEqual(frontmatter, {
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        tags: ['browser', 'rendering'],
        status: 'published',
    })
})

test('normalizeStatus accepts supported values only', () => {
    assert.equal(normalizeStatus('draft'), 'draft')
    assert.equal(normalizeStatus('PUBLISHED'), 'published')
    assert.equal(normalizeStatus('archived'), 'archived')
    assert.equal(normalizeStatus('invalid-status'), '__invalid__')
    assert.equal(normalizeStatus(undefined), undefined)
})

test('isPositiveInteger accepts positive whole numbers only', () => {
    assert.equal(isPositiveInteger(7), true)
    assert.equal(isPositiveInteger(0), false)
    assert.equal(isPositiveInteger(-1), false)
    assert.equal(isPositiveInteger(1.5), false)
    assert.equal(isPositiveInteger('7'), false)
})

test('published content requires explicit editorial metadata', () => {
    const issues = getFrontmatterIssues({
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        status: 'published',
    })

    assert.deepEqual(issues, [
        'summary is required for published content',
        'date is required for published content',
        'updatedAt is required for published content',
        'authorName is required for published content',
        'authorRole is required for published content',
        'readMinutes is required for published content',
        'topicLabel is required for published content',
    ])
})

test('draft content allows missing summary and date', () => {
    const issues = getFrontmatterIssues({
        title: 'Draft Note',
        slug: 'draft-note',
        status: 'draft',
    })

    assert.deepEqual(issues, [])
})

test('missing status, invalid slug, invalid updatedAt, and invalid readMinutes are reported', () => {
    const issues = getFrontmatterIssues({
        title: 'Bad Meta',
        slug: 'Bad_Slug',
        summary: 'Summary',
        date: '2026-08-08',
        updatedAt: 'not-a-date',
        readMinutes: 0,
    })

    assert.deepEqual(issues, [
        'status is required',
        'slug must be lowercase kebab-case',
        'updatedAt must be a valid date string when provided',
        'readMinutes must be a positive integer when provided',
        'authorName is required for published content',
        'authorRole is required for published content',
        'topicLabel is required for published content',
    ])
})

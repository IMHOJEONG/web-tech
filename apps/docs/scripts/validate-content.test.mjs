import test from 'node:test'
import assert from 'node:assert/strict'
import {
    getFrontmatterIssues,
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

test('published content requires title, slug, summary, and date', () => {
    const issues = getFrontmatterIssues({
        title: 'Rendering Pipeline',
        slug: 'rendering-pipeline',
        status: 'published',
    })

    assert.deepEqual(issues, [
        'summary is required for published content',
        'date is required for published content',
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

test('invalid slug and invalid updatedAt are reported', () => {
    const issues = getFrontmatterIssues({
        title: 'Bad Meta',
        slug: 'Bad_Slug',
        summary: 'Summary',
        date: '2026-08-08',
        updatedAt: 'not-a-date',
    })

    assert.deepEqual(issues, [
        'slug must be lowercase kebab-case',
        'updatedAt must be a valid date string when provided',
    ])
})

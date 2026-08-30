import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { shouldIncludeRemoteContentIndex } from './content-api-config.ts'

const originalIncludeRemoteIndex = process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX

afterEach(() => {
    if (originalIncludeRemoteIndex === undefined) {
        delete process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX
        return
    }

    process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX = originalIncludeRemoteIndex
})

test('shouldIncludeRemoteContentIndex defaults to true when env is omitted', () => {
    delete process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX

    assert.equal(shouldIncludeRemoteContentIndex(), true)
})

test('shouldIncludeRemoteContentIndex stays enabled when env is true', () => {
    process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX = 'true'

    assert.equal(shouldIncludeRemoteContentIndex(), true)
})

test('shouldIncludeRemoteContentIndex is disabled only when env is false', () => {
    process.env.BLOG_CONTENT_INCLUDE_REMOTE_INDEX = 'false'

    assert.equal(shouldIncludeRemoteContentIndex(), false)
})

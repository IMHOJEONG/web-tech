import assert from 'node:assert/strict'
import test from 'node:test'
import { selectDocumentBySourcePolicy } from './content-source-policy.ts'

const localDoc = {
    id: 'local',
    title: 'Local document',
}

const remoteDoc = {
    id: 'remote',
    title: 'Remote document',
}

test('selectDocumentBySourcePolicy prefers remote when remote index is enabled', () => {
    assert.equal(
        selectDocumentBySourcePolicy({
            includeRemote: true,
            localDoc,
            remoteDoc,
        }),
        remoteDoc
    )
})

test('selectDocumentBySourcePolicy falls back to local when remote is unavailable', () => {
    assert.equal(
        selectDocumentBySourcePolicy({
            includeRemote: true,
            localDoc,
            remoteDoc: null,
        }),
        localDoc
    )
})

test('selectDocumentBySourcePolicy prefers local when remote index is disabled', () => {
    assert.equal(
        selectDocumentBySourcePolicy({
            includeRemote: false,
            localDoc,
            remoteDoc,
        }),
        localDoc
    )
})

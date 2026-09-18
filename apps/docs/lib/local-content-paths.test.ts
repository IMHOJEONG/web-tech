import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
    getLocalContentDirectories,
    resolveLocalContentRoot,
} from './local-content-paths.ts'

test('resolveLocalContentRoot accepts direct docs app root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-root-'))
    fs.mkdirSync(path.join(root, 'data'))

    try {
        assert.equal(resolveLocalContentRoot(root), root)
    } finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})

test('resolveLocalContentRoot accepts monorepo root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-monorepo-'))
    const docsRoot = path.join(root, 'apps/docs')
    fs.mkdirSync(path.join(docsRoot, 'category'), { recursive: true })

    try {
        assert.equal(resolveLocalContentRoot(root), docsRoot)
    } finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})

test('getLocalContentDirectories includes data and category roots', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-content-roots-'))
    fs.mkdirSync(path.join(root, 'data'))
    fs.mkdirSync(path.join(root, 'category'))

    try {
        assert.deepEqual(getLocalContentDirectories(root), [
            path.join(root, 'data'),
            path.join(root, 'category'),
        ])
    } finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})

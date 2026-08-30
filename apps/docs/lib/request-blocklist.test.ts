import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getRequestBlockReason } from './request-blocklist.ts'

test('blocks root year archive HEAD probes', () => {
    assert.equal(getRequestBlockReason('/2017', 'HEAD'), 'root-year-head-probe')
    assert.equal(
        getRequestBlockReason('/2024/', 'HEAD'),
        'root-year-head-probe'
    )
})

test('does not block root year paths for normal GET requests', () => {
    assert.equal(getRequestBlockReason('/2017', 'GET'), null)
})

test('blocks common sensitive file probes', () => {
    assert.equal(getRequestBlockReason('/.env', 'GET'), 'known-probe-path')
    assert.equal(
        getRequestBlockReason('/config/.env.production', 'GET'),
        'sensitive-file-probe'
    )
    assert.equal(
        getRequestBlockReason('/db-backup.sql', 'GET'),
        'backup-file-probe'
    )
})

test('blocks common wordpress and repository scan paths', () => {
    assert.equal(getRequestBlockReason('/wp-admin', 'GET'), 'known-probe-path')
    assert.equal(
        getRequestBlockReason('/wp-content/debug.log', 'GET'),
        'known-probe-prefix'
    )
    assert.equal(
        getRequestBlockReason('/.git/HEAD', 'GET'),
        'known-probe-prefix'
    )
})

test('allows normal docs routes with year-like nested segments', () => {
    assert.equal(
        getRequestBlockReason(
            '/docs/web/javascript-event-loop-runtime',
            'HEAD'
        ),
        null
    )
    assert.equal(
        getRequestBlockReason('/docs/2026/browser-runtime-notes', 'HEAD'),
        null
    )
})

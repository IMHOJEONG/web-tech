import assert from 'node:assert/strict'
import test from 'node:test'
import {
    buildRemotePayloadSchemaFailureEvent,
    reportRemotePayloadSchemaFailure,
} from './content-api-observability.ts'

test('buildRemotePayloadSchemaFailureEvent returns structured observability payload', () => {
    const event = buildRemotePayloadSchemaFailureEvent({
        label: 'public',
        url: 'https://content.example.com/api/posts',
        payload: {
            results: [{ id: 1 }],
            meta: { page: 1 },
        },
        issues: [
            {
                path: ['results', 0, 'date'],
                message: 'must be a valid date-like value',
            },
        ],
    })

    assert.equal(event.event, 'docs.remote_payload_schema_failure')
    assert.equal(event.label, 'public')
    assert.deepEqual(event.payloadSummary, {
        kind: 'object',
        keys: ['meta', 'results'],
        itemsCount: null,
        resultsCount: 1,
    })
    assert.match(event.issues ?? '', /results\.0\.date/)
})

test('redacts endpoint credentials and groups equivalent field failures', () => {
    const build = (index: number, field = 'date') =>
        buildRemotePayloadSchemaFailureEvent({
            label: 'public',
            url: 'https://user:secret@content.example.com/api/posts?token=private#fragment',
            payload: [{ body: 'private article body' }],
            issues: [
                { path: ['results', index, field], message: 'Invalid date' },
            ],
        })
    const first = build(0)
    assert.equal(first.url, 'https://content.example.com/api/posts')
    assert.equal(first.fingerprint, build(15).fingerprint)
    assert.notEqual(first.fingerprint, build(0, 'status').fingerprint)
    assert.doesNotMatch(JSON.stringify(first), /secret|private|fragment/)
})

test('reporter forwards schema errors and preserves logging when delivery fails', async (t) => {
    const keys = [
        'DOCS_BETTER_STACK_SOURCE_TOKEN',
        'DOCS_BETTER_STACK_INGESTING_URL',
        'DOCS_BETTER_STACK_ENVIRONMENT',
    ] as const
    const original = keys.map((key) => process.env[key])
    t.after(() =>
        keys.forEach((key, index) => {
            if (original[index] === undefined) delete process.env[key]
            else process.env[key] = original[index]
        })
    )
    process.env.DOCS_BETTER_STACK_SOURCE_TOKEN = 'test-token'
    process.env.DOCS_BETTER_STACK_INGESTING_URL = 'https://logs.example.com'
    process.env.DOCS_BETTER_STACK_ENVIRONMENT = 'preview'
    const errors = t.mock.method(console, 'error', () => {})
    const warnings = t.mock.method(console, 'warn', () => {})
    const event = buildRemotePayloadSchemaFailureEvent({
        label: 'public',
        url: 'https://content.example.com/api/posts',
        payload: null,
        issues: [],
    })
    const transport = t.mock.method(
        globalThis,
        'fetch',
        async (_url: unknown, init?: RequestInit) => {
            const body = JSON.parse(String(init?.body))
            assert.equal(body.event, event.event)
            assert.equal(body.fingerprint, event.fingerprint)
            assert.equal(body.level, 'error')
            return new Response(null, { status: 403 })
        }
    )
    await assert.doesNotReject(reportRemotePayloadSchemaFailure(event))
    assert.equal(transport.mock.callCount(), 1)
    assert.equal(errors.mock.callCount(), 1)
    assert.equal(warnings.mock.callCount(), 1)
})

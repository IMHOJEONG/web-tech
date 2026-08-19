import assert from 'node:assert/strict'
import test from 'node:test'
import { buildRemotePayloadSchemaFailureEvent } from './content-api-observability.ts'

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

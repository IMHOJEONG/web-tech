import {
    formatRemotePayloadIssues,
    summarizeRemotePayloadShape,
} from './content-api-schema.ts'

export type RemotePayloadSchemaFailureEvent = {
    event: 'docs.remote_payload_schema_failure'
    label: 'public' | 'internal' | 'default'
    url: string
    payloadSummary: ReturnType<typeof summarizeRemotePayloadShape>
    issues: string | null
}

export function buildRemotePayloadSchemaFailureEvent(input: {
    label: 'public' | 'internal' | 'default'
    url: string
    payload: unknown
    issues: Array<{ path: PropertyKey[]; message: string }> | null | undefined
}) {
    return {
        event: 'docs.remote_payload_schema_failure',
        label: input.label,
        url: input.url,
        payloadSummary: summarizeRemotePayloadShape(input.payload),
        issues:
            input.issues && input.issues.length > 0
                ? formatRemotePayloadIssues(input.issues)
                : null,
    } satisfies RemotePayloadSchemaFailureEvent
}

export function reportRemotePayloadSchemaFailure(
    event: RemotePayloadSchemaFailureEvent
) {
    console.error('[docs] Remote payload schema validation failed:', event)
}

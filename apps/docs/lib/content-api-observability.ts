import { createHash } from 'node:crypto'
import { sendBetterStackEvent } from './better-stack.ts'
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
    fingerprint: string
}

function sanitizeEndpoint(value: string) {
    try {
        const url = new URL(value)
        return `${url.origin}${url.pathname}`
    } catch {
        return '[invalid-url]'
    }
}

export function buildRemotePayloadSchemaFailureEvent(input: {
    label: 'public' | 'internal' | 'default'
    url: string
    payload: unknown
    issues: Array<{ path: PropertyKey[]; message: string }> | null | undefined
}) {
    const url = sanitizeEndpoint(input.url)
    // Array position changes must not split the same contract error into new groups.
    const issuePaths = [
        ...new Set(
            (input.issues ?? []).map((issue) =>
                issue.path
                    .map((part) =>
                        typeof part === 'number' ? '*' : String(part)
                    )
                    .join('.')
            )
        ),
    ].sort()
    const fingerprint = createHash('sha256')
        .update(JSON.stringify([input.label, url, issuePaths]))
        .digest('hex')
    return {
        event: 'docs.remote_payload_schema_failure',
        label: input.label,
        url,
        fingerprint,
        payloadSummary: summarizeRemotePayloadShape(input.payload),
        issues:
            input.issues && input.issues.length > 0
                ? formatRemotePayloadIssues(input.issues)
                : null,
    } satisfies RemotePayloadSchemaFailureEvent
}

export async function reportRemotePayloadSchemaFailure(
    event: RemotePayloadSchemaFailureEvent
) {
    console.error('[docs] Remote payload schema validation failed:', event)
    const delivery = await sendBetterStackEvent(
        {
            ...event,
            level: 'error',
            message: event.event,
        },
        {
            sourceToken: process.env.DOCS_BETTER_STACK_SOURCE_TOKEN,
            ingestingUrl: process.env.DOCS_BETTER_STACK_INGESTING_URL,
            environment: process.env.DOCS_BETTER_STACK_ENVIRONMENT,
        }
    )
    if (delivery.status !== 'sent' && delivery.status !== 'disabled') {
        console.warn('[docs] Better Stack delivery failed:', delivery)
    }
}

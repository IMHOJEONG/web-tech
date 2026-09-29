// Test-only observation model. No runtime application imports this module.
import { randomUUID } from 'node:crypto'

export type ErrorCategory =
    | 'render'
    | 'upstream'
    | 'timeout'
    | 'transport'
    | 'stream'
    | 'unknown'
type Outcome = 'completed' | 'cancelled' | 'degraded' | 'failed' | 'unknown'
type EventName =
    | 'started'
    | 'error'
    | 'recovered'
    | 'cancel'
    | 'finished'
    | 'closed'
type LifecycleEvent = {
    eventId: string
    event: EventName
    sequence: number
    timestamp: string
    elapsedMs: number
    errorCategory?: ErrorCategory
    digest?: string
    errorId?: string
    phase?: 'before-headers' | 'after-headers' | 'unknown'
}

const publicArticles = new Set([
    '/ko/docs/web/javascript-event-loop-runtime',
    '/en/docs/web/javascript-event-loop-runtime',
    '/ko/docs/web/article-e2e-publication',
    '/en/docs/web/article-e2e-publication',
])

export function describeRequest(url: string, headers: Record<string, unknown>) {
    const parsed = new URL(url, 'http://fixture.invalid')
    const path = parsed.pathname
    // Arbitrary slugs and query values must not reach even local artifacts.
    const route = /^\/(ko|en)\/docs\/.+/.test(path)
        ? '/[locale]/docs/[...slugParts]'
        : /^\/(ko|en)\/(docs|about|feed|web|mobile|ui-ux)$/.test(path)
          ? path
          : path === '/api/revalidate/content'
            ? path
            : '[redacted]'
    const prefetchEvidence = [
        ...(headers['next-router-prefetch'] === '1'
            ? ['next-router-prefetch']
            : []),
        ...(typeof headers['next-router-segment-prefetch'] === 'string'
            ? ['next-router-segment-prefetch']
            : []),
    ]
    return {
        // Test correlation hint only, never the server's authoritative request ID.
        clientProbeId:
            typeof headers['x-article-client-probe'] === 'string' &&
            /^[a-f0-9-]{36}$/.test(headers['x-article-client-probe'])
                ? headers['x-article-client-probe']
                : null,
        path: publicArticles.has(path) ? path : route,
        route,
        queryPresent: Boolean(parsed.search),
        prefetch: prefetchEvidence.length > 0,
        prefetchEvidence,
        requestKind: path.startsWith('/api/')
            ? 'api'
            : headers.rsc === '1'
              ? 'rsc'
              : headers['sec-fetch-dest'] === 'document'
                ? 'document'
                : 'unknown',
    }
}

export class RequestLifecycle {
    readonly requestId = randomUUID()
    readonly metadata: ReturnType<typeof describeRequest>
    readonly method: string
    readonly errorCoverage: 'complete' | 'partial'
    private readonly start = performance.now()
    private readonly events: LifecycleEvent[] = []
    private readonly errors = new Map<string, ErrorCategory>()
    private sequence = 0
    private omittedEvents = 0
    private errorOverflow = false
    private fatalOverflow = false
    private terminalSequence: number | null = null
    private degraded = false
    private cancelled = false
    private finished: boolean | null = null
    private closed: boolean | null = null
    private closeBeforeFinish: boolean | null = null
    private statusCode: number | null = null
    private headersSent = false
    private durationMs: number | null = null
    private durationScope: 'request-to-finish' | 'request-to-close' | null =
        null

    constructor(
        url: string,
        method: string,
        headers: Record<string, unknown>,
        errorCoverage: 'complete' | 'partial' = 'partial'
    ) {
        this.metadata = describeRequest(url, headers)
        this.method = [
            'GET',
            'HEAD',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
        ].includes(method)
            ? method
            : 'OTHER'
        this.errorCoverage = errorCoverage
        this.record('started')
    }

    private record(event: EventName, details: Partial<LifecycleEvent> = {}) {
        const item: LifecycleEvent = {
            ...details,
            eventId: randomUUID(),
            event,
            sequence: ++this.sequence,
            timestamp: new Date().toISOString(),
            elapsedMs: Math.round((performance.now() - this.start) * 100) / 100,
        }
        if (this.events.length === 16) {
            this.events.splice(1, 1)
            this.omittedEvents++
        }
        this.events.push(item)
        return item
    }

    error(
        category: ErrorCategory,
        digest?: unknown,
        phase: LifecycleEvent['phase'] = 'unknown'
    ) {
        const errorId = randomUUID()
        if (this.errors.size < 8) this.errors.set(errorId, category)
        else {
            this.errorOverflow = true
            this.fatalOverflow ||= ['render', 'upstream', 'timeout'].includes(
                category
            )
        }
        this.record('error', {
            errorId,
            errorCategory: category,
            phase,
            digest:
                typeof digest === 'string' &&
                /^[a-zA-Z0-9_-]{1,64}$/.test(digest)
                    ? digest
                    : undefined,
        })
        return errorId
    }

    recover(errorId: string) {
        if (!this.errors.has(errorId)) return
        this.errors.delete(errorId)
        this.degraded = true
        this.record('recovered', { errorId })
    }

    // Called by a controlled test before it aborts this exact HTTP request.
    controlledCancel() {
        this.cancelled = true
        this.record('cancel')
    }

    finish(status: number, headersSent: boolean) {
        if (this.finished) return
        this.finished = true
        this.headersSent = headersSent
        this.statusCode = headersSent ? status : null
        const event = this.record('finished')
        this.terminalSequence ??= event.sequence
        this.durationMs = event.elapsedMs
        this.durationScope = 'request-to-finish'
    }

    close(status: number, headersSent: boolean) {
        if (this.closed) return
        this.closed = true
        this.closeBeforeFinish = this.finished !== true
        this.finished ??= false
        this.headersSent = headersSent
        this.statusCode = headersSent ? status : null
        const event = this.record('closed')
        this.terminalSequence ??= event.sequence
        if (this.closeBeforeFinish) {
            this.durationMs = event.elapsedMs
            this.durationScope = 'request-to-close'
        }
    }

    snapshot() {
        let outcome: Outcome = 'unknown'
        let reason = 'insufficient-evidence'
        const fatal = [...this.errors.values()].some((category) =>
            ['render', 'upstream', 'timeout'].includes(category)
        )
        if (
            fatal ||
            this.fatalOverflow ||
            (this.statusCode !== null && this.statusCode >= 500)
        ) {
            outcome = 'failed'
            reason = 'unrecovered-error-or-5xx'
        } else if (this.errorOverflow) {
            reason = 'error-buffer-overflow'
        } else if (this.finished && this.errors.size === 0) {
            outcome = this.degraded ? 'degraded' : 'completed'
            reason = this.degraded
                ? 'recovered-response-finished'
                : 'server-response-finished'
        } else if (
            this.closeBeforeFinish &&
            this.cancelled &&
            this.errorCoverage === 'complete' &&
            this.errors.size === 0
        ) {
            outcome = 'cancelled'
            reason = 'controlled-request-abort'
        } else if (this.closeBeforeFinish) {
            reason = this.metadata.prefetch
                ? 'prefetch-cancellation-suspected'
                : 'unexplained-early-close'
        }
        return {
            schemaVersion: 1,
            event: 'docs.request.summary',
            requestId: this.requestId,
            service: 'docs',
            environment: 'test',
            observer: 'node-fixture',
            ...this.metadata,
            method: this.method,
            errorCoverage: this.errorCoverage,
            responseFinished: this.finished,
            responseClosed: this.closed,
            closeBeforeFinish: this.closeBeforeFinish,
            transportClosed: null,
            headersSent: this.headersSent,
            statusCode: this.statusCode,
            durationMs: this.durationMs,
            durationScope: this.durationScope,
            outcome,
            reason,
            level:
                outcome === 'failed'
                    ? 'error'
                    : ['unknown', 'degraded'].includes(outcome)
                      ? 'warn'
                      : 'info',
            precedingErrorIds: this.events
                .filter(
                    (event) =>
                        event.event === 'error' &&
                        (this.terminalSequence === null ||
                            event.sequence < this.terminalSequence)
                )
                .slice(-8)
                .map((event) => event.errorId),
            omittedEvents: this.omittedEvents,
            events: [...this.events],
        }
    }
}

export type LifecycleSummary = ReturnType<RequestLifecycle['snapshot']>

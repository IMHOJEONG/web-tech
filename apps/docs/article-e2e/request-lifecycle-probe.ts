// Imported only by the loopback Playwright Next process, never by next build.
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { IncomingMessage, Server, ServerResponse } from 'node:http'
import { mock } from 'node:test'
import {
    bindResponseObservation,
    currentRequestObservation,
    observeRequest,
    withRequestObservation,
} from './request-lifecycle-observer.ts'
import {
    attachRequestCauseTrace,
    recordCurrentRequestCause,
    safeErrorEvidence,
} from './request-cause-trace.ts'

const originalEmit = Server.prototype.emit
const originalError = console.error
// eslint-disable-next-line turbo/no-undeclared-env-vars
const traceAll = process.env.ARTICLE_STREAM_TRACE === '1'
// eslint-disable-next-line turbo/no-undeclared-env-vars
const traceCause = process.env.ARTICLE_CAUSE_TRACE === '1'

mock.method(
    Server.prototype,
    'emit',
    function (this: Server, event: string, ...args: unknown[]) {
        const [request, response] = args
        if (
            event !== 'request' ||
            !(request instanceof IncomingMessage) ||
            !(response instanceof ServerResponse) ||
            request.socket.localPort !== 3111 ||
            (!traceAll &&
                !traceCause &&
                request.headers['x-article-lifecycle-probe'] !== '1' &&
                request.headers['x-article-cause-probe'] !== '1')
        ) {
            return Reflect.apply(originalEmit, this, [event, ...args])
        }
        const observation = observeRequest(request, response, (summary) => {
            const directory = path.resolve('test-results/request-lifecycle')
            mkdirSync(directory, { recursive: true })
            const file = path.join(directory, `${summary.requestId}.json`)
            // Readers must see an old or new snapshot, never a truncated JSON.
            writeFileSync(`${file}.tmp`, JSON.stringify(summary))
            renameSync(`${file}.tmp`, file)
        })
        bindResponseObservation(response, observation)
        if (traceCause || request.headers['x-article-cause-probe'] === '1')
            attachRequestCauseTrace(request, response, observation)
        // Test process only: fresh ID at the HTTP boundary, not in cached content.
        response.setHeader('x-article-request-id', observation.state.requestId)
        return withRequestObservation(observation, () => {
            try {
                return Reflect.apply(originalEmit, this, [event, ...args])
            } catch (error) {
                observation.error('render')
                throw error
            }
        })
    }
)

mock.method(console, 'error', (...args: unknown[]) => {
    try {
        const error = args.find(
            (value): value is Error => value instanceof Error
        )
        const isStream = args.some((value) =>
            (typeof value === 'string'
                ? value
                : value instanceof Error
                  ? value.message
                  : ''
            ).includes('The destination stream closed early.')
        )
        const observation = currentRequestObservation()
        if (observation && (error || isStream)) {
            const digest = error && 'digest' in error ? error.digest : undefined
            // A generic console error does not prove an unrecovered render failure.
            observation.error(isStream ? 'stream' : 'unknown', digest)
            recordCurrentRequestCause(
                isStream ? 'framework-stream-error' : 'console-error',
                safeErrorEvidence(error)
            )
        } else if (traceAll && isStream) {
            originalError(
                '[article-lifecycle]',
                JSON.stringify({
                    event: 'docs.request.error',
                    requestId: null,
                    correlation: 'unavailable',
                    errorCategory: 'stream',
                })
            )
        }
        if (args[0] === '[docs.runtime]' && typeof args[1] === 'string') {
            const hook = JSON.parse(args[1]) as { requestId?: string }
            if (/^[\da-f-]{36}$/i.test(hook.requestId ?? ''))
                recordCurrentRequestCause('runtime-hook', {
                    applicationRequestId: hook.requestId,
                })
        }
    } catch {
        // Observation must not replace the framework's original error handling.
    } finally {
        // Preserve framework diagnostics, including errors without request context.
        originalError(...args)
    }
})

const originalWarn = console.warn
mock.method(console, 'warn', (...args: unknown[]) => {
    try {
        const error = args.find((value) => value instanceof Error)
        if (error)
            recordCurrentRequestCause(
                'console-warning',
                safeErrorEvidence(error)
            )
    } catch {
        // Diagnostics must not turn a recoverable warning into a render error.
    } finally {
        originalWarn(...args)
    }
})

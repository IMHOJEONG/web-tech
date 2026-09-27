// Imported only by the loopback Playwright Next process, never by next build.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { IncomingMessage, Server, ServerResponse } from 'node:http'
import { mock } from 'node:test'
import {
    bindResponseObservation,
    currentRequestObservation,
    observeRequest,
    withRequestObservation,
} from './request-lifecycle-observer.ts'

const originalEmit = Server.prototype.emit
const originalError = console.error
// eslint-disable-next-line turbo/no-undeclared-env-vars
const traceAll = process.env.ARTICLE_STREAM_TRACE === '1'

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
            (!traceAll && request.headers['x-article-lifecycle-probe'] !== '1')
        ) {
            return Reflect.apply(originalEmit, this, [event, ...args])
        }
        const observation = observeRequest(request, response, (summary) => {
            const directory = path.resolve('test-results/request-lifecycle')
            mkdirSync(directory, { recursive: true })
            writeFileSync(
                path.join(directory, `${summary.requestId}.json`),
                JSON.stringify(summary)
            )
        })
        bindResponseObservation(response, observation)
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
    } catch {
        // Observation must not replace the framework's original error handling.
    } finally {
        // Preserve framework diagnostics, including errors without request context.
        originalError(...args)
    }
})

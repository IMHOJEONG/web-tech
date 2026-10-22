// Loopback test preload only. Observe transport order without changing fetch keys.
import { randomUUID } from 'node:crypto'
import { subscribe } from 'node:diagnostics_channel'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Socket } from 'node:net'
import { currentRequestObservation } from './request-lifecycle-observer.ts'

type Observation = NonNullable<ReturnType<typeof currentRequestObservation>>
type Trace = ReturnType<typeof createTrace>
const traces = new WeakMap<Observation, Trace>()
const sockets = new WeakMap<Socket, { id: string; active: Set<Trace> }>()
const upstreams = new WeakMap<object, Trace>()

export function safeErrorEvidence(value: unknown) {
    const error = value as {
        code?: unknown
        kind?: unknown
        status?: unknown
        stack?: unknown
    } | null
    const code =
        [
            'ECONNRESET',
            'EPIPE',
            'ABORT_ERR',
            'UND_ERR_ABORTED',
            'UND_ERR_SOCKET',
            'UND_ERR_CONNECT_TIMEOUT',
        ].find((candidate) => candidate === error?.code) ?? null
    const kind =
        ['http', 'timeout', 'network', 'empty'].find(
            (candidate) => candidate === error?.kind
        ) ?? null
    const status =
        typeof error?.status === 'number' &&
        Number.isInteger(error.status) &&
        error.status >= 100 &&
        error.status <= 599
            ? error.status
            : null
    const frames =
        typeof error?.stack === 'string'
            ? [
                  ...error.stack.matchAll(
                      /(?:react-server-dom-[\w.-]+\.js:\d+:\d+|pipe-readable\.js:\d+:\d+|node:(?:net|_http_server|internal\/streams\/[\w-]+):\d+:\d+)/g
                  ),
              ]
                  .slice(0, 8)
                  .map((match) => match[0])
            : []
    return { code, kind, status, frames }
}

function createTrace(
    request: IncomingMessage,
    response: ServerResponse,
    observation: Observation,
    socketId: string
) {
    const events: {
        sequence: number
        time: string
        elapsedMs: number
        event: string
        detail: object
    }[] = []
    const started = performance.now()
    let omitted = 0
    let deliveryFailures = 0
    function record(event: string, detail: object = {}) {
        if (events.length === 64) omitted++
        else
            events.push({
                sequence: events.length + 1,
                time: new Date().toISOString(),
                elapsedMs: +(performance.now() - started).toFixed(2),
                event,
                detail,
            })
        try {
            const directory = 'test-results/request-cause'
            mkdirSync(directory, { recursive: true })
            const file = `${directory}/${observation.state.requestId}.json`
            writeFileSync(
                `${file}.tmp`,
                JSON.stringify({
                    requestId: observation.state.requestId,
                    socketId,
                    path: new URL(request.url ?? '/', 'http://fixture')
                        .pathname,
                    prefetch: request.headers['next-router-prefetch'] === '1',
                    status: response.headersSent ? response.statusCode : null,
                    responseFinished: response.writableFinished,
                    omitted,
                    deliveryFailures,
                    events,
                })
            )
            renameSync(`${file}.tmp`, file)
        } catch {
            deliveryFailures++
        }
    }
    return { record }
}

export function attachRequestCauseTrace(
    request: IncomingMessage,
    response: ServerResponse,
    observation: Observation
) {
    const pathname = new URL(request.url ?? '/', 'http://fixture').pathname
    if (
        !/^\/(ko|en)\/docs\/web\/article-e2e-(remote|publication)$/.test(
            pathname
        )
    )
        return
    const socket = request.socket
    let transport = sockets.get(socket)
    if (!transport) {
        transport = { id: randomUUID(), active: new Set<Trace>() }
        sockets.set(socket, transport)
        const observed = transport
        const emit = socket.emit
        socket.emit = function (event: string | symbol, ...args: unknown[]) {
            if (
                event === 'end' ||
                event === 'close' ||
                event === 'error' ||
                event === 'timeout'
            ) {
                for (const trace of observed.active)
                    trace.record(
                        `socket-${event}`,
                        event === 'error'
                            ? safeErrorEvidence(args[0])
                            : event === 'close'
                              ? { hadError: args[0] === true }
                              : {}
                    )
            }
            const result = Reflect.apply(emit, this, [event, ...args])
            if (event === 'close') observed.active.clear()
            return result
        }
        const destroy = socket.destroy
        socket.destroy = function (error?: Error) {
            for (const trace of observed.active)
                trace.record(
                    'socket-destroy-call',
                    safeErrorEvidence(error ?? new Error())
                )
            return Reflect.apply(destroy, this, [error])
        }
        const end = socket.end
        socket.end = function (...args: unknown[]): Socket {
            for (const trace of observed.active)
                trace.record('socket-end-call', safeErrorEvidence(new Error()))
            return Reflect.apply(end, this, args) as Socket
        }
    }
    const trace = createTrace(request, response, observation, transport.id)
    traces.set(observation, trace)
    transport.active.add(trace)
    trace.record('request-start')
    response.once('finish', () => {
        trace.record('response-finish')
        transport.active.delete(trace)
    })
    response.once('close', () => trace.record('response-close'))
    const destroy = response.destroy
    const end = response.end
    response.end = function (...args: unknown[]): ServerResponse {
        trace.record('response-end-call')
        return Reflect.apply(end, this, args) as ServerResponse
    }
    response.destroy = function (error?: Error) {
        trace.record(
            'response-destroy-call',
            safeErrorEvidence(error ?? new Error())
        )
        return Reflect.apply(destroy, this, [error])
    }
    if (request.headers['x-article-cause-fault'] === 'response-destroy') {
        const write = response.write
        let scheduled = false
        response.write = function (...args: unknown[]): boolean {
            const result = Reflect.apply(write, this, args) as boolean
            if (!scheduled) {
                scheduled = true
                setTimeout(() => {
                    if (!response.writableFinished && !response.destroyed) {
                        trace.record('controlled-server-destroy')
                        response.destroy()
                    }
                }, 30).unref()
            }
            return result
        }
    }
}

export function recordCurrentRequestCause(event: string, detail: object = {}) {
    const observation = currentRequestObservation()
    if (observation) traces.get(observation)?.record(event, detail)
}

for (const [channel, event] of [
    ['undici:request:create', 'upstream-start'],
    ['undici:request:headers', 'upstream-headers'],
    ['undici:request:trailers', 'upstream-complete'],
    ['undici:request:error', 'upstream-error'],
] as const) {
    subscribe(channel, (message) => {
        try {
            const data = message as {
                request?: { origin?: string; path?: string }
                response?: { statusCode?: number }
                error?: unknown
            }
            const request = data.request
            if (
                !request ||
                String(request.origin) !== 'http://127.0.0.1:3112' ||
                ![
                    '/api/posts',
                    '/posts/web/article-e2e-remote',
                    '/posts/web/article-e2e-publication',
                ].includes(request.path ?? '')
            )
                return
            if (event === 'upstream-start') {
                const observation = currentRequestObservation()
                const trace = observation && traces.get(observation)
                if (trace) upstreams.set(request, trace)
            }
            upstreams.get(request)?.record(event, {
                path: request.path,
                ...(event === 'upstream-headers'
                    ? { status: data.response?.statusCode }
                    : {}),
                ...(event === 'upstream-error'
                    ? safeErrorEvidence(data.error)
                    : {}),
            })
        } catch {
            // A diagnostics subscriber must never fail the observed fetch.
        }
    })
}

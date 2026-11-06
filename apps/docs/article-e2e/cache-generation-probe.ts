// Loaded only by the experiment config; never imported by the application.
import { AsyncLocalStorage } from 'node:async_hooks'
import { IncomingMessage, Server, ServerResponse } from 'node:http'
import { createRequire } from 'node:module'
import { mock } from 'node:test'
import { articleFixtureAuthorization } from './fixture-credentials.ts'
import {
    createGenerationSession,
    type Lease,
} from './cache-generation-session.ts'

const require = createRequire(import.meta.url)
type Operation = (...args: unknown[]) => Promise<unknown>
const Cache =
    require('next/dist/server/lib/incremental-cache/file-system-cache')
        .default as { prototype: Record<'get' | 'set', Operation> }
const counters = () => ({
    requests: 0,
    activeRequests: 0,
    activeOperations: 0,
    reads: 0,
    writes: 0,
    lateWrites: 0,
    rejectedWrites: 0,
})
type Session = ReturnType<typeof createGenerationSession>
type Counters = ReturnType<typeof counters>
let session = createGenerationSession('generation')
let counts = counters()
const scope = new AsyncLocalStorage<{
    session: Session
    lease: Lease
    counts: Counters
}>()
const emit = Server.prototype.emit
mock.method(
    Server.prototype,
    'emit',
    function (this: Server, event: string, ...args: unknown[]) {
        const request = args[0]
        const response = args[1]
        if (
            event !== 'request' ||
            !(request instanceof IncomingMessage) ||
            !(response instanceof ServerResponse) ||
            request.socket.localPort !== 3111
        )
            return Reflect.apply(emit, this, [event, ...args])
        if (request.url?.startsWith('/__test/cache-generation/')) {
            response.setHeader('Cache-Control', 'private, no-store')
            response.setHeader('Content-Type', 'application/json')
            if (
                request.headers.authorization !==
                articleFixtureAuthorization('control')
            ) {
                response.writeHead(401).end('{}')
                return true
            }
            const action = request.url.slice('/__test/cache-generation/'.length)
            if (request.method === 'POST' && action.startsWith('reset-')) {
                if (counts.activeRequests || counts.activeOperations) {
                    response.writeHead(409).end('{}')
                    return true
                }
                const mode = action.slice('reset-'.length)
                if (mode !== 'baseline' && mode !== 'generation') {
                    response.writeHead(400).end('{}')
                    return true
                }
                session = createGenerationSession(mode)
                counts = counters()
            } else if (
                request.method === 'POST' &&
                (action === 'advance-r1' || action === 'advance-r2')
            ) {
                const expected = Number(
                    request.headers['x-expected-generation']
                )
                if (
                    !Number.isSafeInteger(expected) ||
                    !session.advance(
                        expected,
                        action === 'advance-r1' ? 'r1' : 'r2'
                    )
                ) {
                    response.writeHead(409).end('{}')
                    return true
                }
            } else if (!(request.method === 'GET' && action === 'state')) {
                response.writeHead(404).end('{}')
                return true
            }
            response.end(
                JSON.stringify({
                    mode: session.mode,
                    ...session.current(),
                    ...counts,
                })
            )
            return true
        }
        if (request.headers['x-article-generation-probe'] !== '1')
            return Reflect.apply(emit, this, [event, ...args])
        const captured = { session, lease: session.current(), counts }
        captured.counts.requests++
        captured.counts.activeRequests++
        let ended = false
        const end = () => {
            if (!ended) captured.counts.activeRequests--
            ended = true
        }
        response.once('finish', end)
        response.once('close', end)
        return scope.run(captured, () =>
            Reflect.apply(emit, this, [event, ...args])
        )
    }
)
for (const operation of ['get', 'set'] as const) {
    const original = Cache.prototype[operation]
    mock.method(
        Cache.prototype,
        operation,
        async function (this: unknown, ...args: unknown[]) {
            const captured = scope.getStore()
            const kind = (args[1] as { kind?: unknown } | undefined)?.kind
            if (!captured || kind !== 'FETCH' || typeof args[0] !== 'string')
                return Reflect.apply(original, this, args)
            const { session: owner, lease, counts: own } = captured
            own.activeOperations++
            try {
                if (operation === 'get') own.reads++
                else {
                    own.writes++
                    if (lease.generation !== owner.current().generation)
                        own.lateWrites++
                    if (!owner.canWrite(lease)) {
                        own.rejectedWrites++
                        return
                    }
                }
                const key = owner.keyFor(args[0], lease)
                return await Reflect.apply(original, this, [
                    key,
                    ...args.slice(1),
                ])
            } finally {
                own.activeOperations--
            }
        }
    )
}

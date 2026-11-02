// Loopback process only; no cache keys, headers, URLs or response bodies are saved.
import { createHash } from 'node:crypto'
import { AsyncLocalStorage } from 'node:async_hooks'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { IncomingMessage, Server } from 'node:http'
import { createRequire } from 'node:module'
import { isAbsolute, join } from 'node:path'
import { mock } from 'node:test'

// eslint-disable-next-line turbo/no-undeclared-env-vars
const directory = process.env.ARTICLE_CACHE_OBSERVATION_DIR
if (directory) {
    if (!isAbsolute(directory))
        throw new Error('Use a private absolute output directory')
    const require = createRequire(import.meta.url)
    type Operation = (...args: unknown[]) => Promise<unknown>
    const Cache =
        require('next/dist/server/lib/incremental-cache/file-system-cache')
            .default as {
            prototype: Record<'get' | 'set' | 'revalidateTag', Operation>
        }
    const events: object[] = []
    const scope = new AsyncLocalStorage<number>()
    let probeSequence = 0
    const emit = Server.prototype.emit
    mock.method(
        Server.prototype,
        'emit',
        function (this: Server, event: string, ...args: unknown[]) {
            const request = args[0]
            if (
                event === 'request' &&
                request instanceof IncomingMessage &&
                request.socket.localPort === 3111 &&
                request.headers['x-article-cache-probe'] === '1'
            ) {
                return scope.run(++probeSequence, () =>
                    Reflect.apply(emit, this, [event, ...args])
                )
            }
            return Reflect.apply(emit, this, [event, ...args])
        }
    )
    let omitted = 0
    let deliveryFailures = 0
    const started = performance.now()
    function record(
        operation: string,
        phase: string,
        key: unknown,
        value?: unknown
    ) {
        const entry = value as {
            lastModified?: unknown
            isStale?: unknown
        } | null
        if (events.length >= 4096) omitted++
        else
            events.push({
                probeId: scope.getStore() ?? null,
                sequence: events.length + 1,
                elapsedMs: performance.now() - started,
                operation,
                phase,
                keyHash:
                    typeof key === 'string'
                        ? createHash('sha256')
                              .update(key)
                              .digest('hex')
                              .slice(0, 24)
                        : null,
                lastModified:
                    typeof entry?.lastModified === 'number'
                        ? entry.lastModified
                        : null,
                found:
                    phase === 'end' && operation === 'get'
                        ? value !== null
                        : null,
            })
        try {
            mkdirSync(directory!, { recursive: true, mode: 0o700 })
            const file = join(directory!, 'cache-events.json')
            writeFileSync(
                `${file}.tmp`,
                JSON.stringify({ events, omitted, deliveryFailures }),
                { mode: 0o600 }
            )
            renameSync(`${file}.tmp`, file)
        } catch {
            deliveryFailures++
        }
    }
    for (const operation of ['get', 'set', 'revalidateTag'] as const) {
        const original = Cache.prototype[operation]
        mock.method(
            Cache.prototype,
            operation,
            async function (this: unknown, ...args: unknown[]) {
                if (scope.getStore() === undefined)
                    return Reflect.apply(original, this, args)
                record(
                    operation,
                    'start',
                    operation === 'revalidateTag' ? null : args[0]
                )
                try {
                    const result: unknown = await Reflect.apply(
                        original,
                        this,
                        args
                    )
                    record(
                        operation,
                        'end',
                        operation === 'revalidateTag' ? null : args[0],
                        result
                    )
                    return result
                } catch (error) {
                    record(
                        operation,
                        'error',
                        operation === 'revalidateTag' ? null : args[0]
                    )
                    throw error
                }
            }
        )
    }
}

// Loaded only by the fixture-backed Next server, never by the application.
import fs from 'node:fs'
import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { IncomingMessage, Server, ServerResponse } from 'node:http'
import { mock } from 'node:test'

interface LocalIoCounters {
    reads: Map<string, number>
    directoryReads: number
}

const storage = new AsyncLocalStorage<LocalIoCounters>()
const roots = ['data', 'category'].map((name) => path.resolve(name) + path.sep)
const originalRead = fs.readFileSync
const originalDirectory = fs.readdirSync
const originalEmit = Server.prototype.emit

function isContentPath(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        roots.some((root) => value.startsWith(root))
    )
}

mock.method(
    fs,
    'readFileSync',
    (...args: Parameters<typeof fs.readFileSync>) => {
        const counters = storage.getStore()
        const file = args[0]
        if (counters && isContentPath(file) && /\.(md|mdx)$/.test(file)) {
            counters.reads.set(file, (counters.reads.get(file) ?? 0) + 1)
        }
        return originalRead(...args)
    }
)

mock.method(fs, 'readdirSync', (...args: Parameters<typeof fs.readdirSync>) => {
    const counters = storage.getStore()
    if (counters && isContentPath(String(args[0]) + path.sep)) {
        counters.directoryReads++
    }
    return originalDirectory(...args)
})

mock.method(
    Server.prototype,
    'emit',
    function (this: Server, event: string, ...args: unknown[]) {
        const [request, response] = args
        if (
            event === 'request' &&
            request instanceof IncomingMessage &&
            response instanceof ServerResponse
        ) {
            const id = request.headers['x-article-io-probe']
            if (typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id)) {
                const counters: LocalIoCounters = {
                    reads: new Map(),
                    directoryReads: 0,
                }
                response.once('finish', () => {
                    const output = path.resolve('test-results/local-io')
                    fs.mkdirSync(output, { recursive: true })
                    fs.writeFileSync(
                        path.join(output, `${id}.json`),
                        JSON.stringify({
                            uniqueFiles: counters.reads.size,
                            totalReads: [...counters.reads.values()].reduce(
                                (sum, count) => sum + count,
                                0
                            ),
                            maxReadsPerFile: Math.max(
                                0,
                                ...counters.reads.values()
                            ),
                            directoryReads: counters.directoryReads,
                        })
                    )
                })
                return storage.run(counters, () =>
                    Reflect.apply(originalEmit, this, [event, ...args])
                )
            }
        }
        return Reflect.apply(originalEmit, this, [event, ...args])
    }
)

import ky from 'ky'

const networkCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
    'UND_ERR_SOCKET',
    'ABORT_ERR',
] as const
type NetworkCode = (typeof networkCodes)[number]

function readNetworkCode(error: unknown): NetworkCode | undefined {
    const visited = new Set<unknown>()
    try {
        for (let depth = 0; depth < 5; depth++) {
            if (
                typeof error !== 'object' ||
                error === null ||
                visited.has(error)
            )
                break
            visited.add(error)
            const candidate = error as { code?: unknown; cause?: unknown }
            const code = networkCodes.find((value) => value === candidate.code)
            if (code) return code
            error = candidate.cause
        }
    } catch {
        // Untrusted accessors must not replace the original request failure.
    }
    return undefined
}

export class ContentApiRequestError extends Error {
    readonly kind: 'timeout' | 'http' | 'empty' | 'network' | 'too-large'
    readonly status?: number
    readonly phase?: 'headers' | 'body'
    readonly causeCode?: NetworkCode

    constructor(
        kind: ContentApiRequestError['kind'],
        status?: number,
        diagnostics?: { phase: 'headers' | 'body'; causeCode?: NetworkCode }
    ) {
        super(
            `Content API request failed: ${kind}${status ? ` (${status})` : ''}`
        )
        this.name = 'ContentApiRequestError'
        this.kind = kind
        this.status = status
        this.phase = diagnostics?.phase
        this.causeCode = diagnostics?.causeCode
    }
}

type ContentApiReadOptions = {
    deadline: number
    headers?: Record<string, string>
    next?: { revalidate: number; tags: string[] }
    fetch?: typeof globalThis.fetch
    maxBytes?: number
}

// One deadline covers headers and the entire body, not an idle timeout per chunk.
export async function readContentApiResponse(
    url: string,
    options: ContentApiReadOptions
): Promise<{ text: string; contentType: string | null }> {
    const remaining = options.deadline - Date.now()
    if (remaining <= 0) throw new ContentApiRequestError('timeout')
    if (
        options.maxBytes !== undefined &&
        (!Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0)
    ) {
        throw new RangeError('maxBytes must be a positive safe integer')
    }

    const controller = new AbortController()
    let response: Response | undefined
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(
                new ContentApiRequestError('timeout', undefined, {
                    phase: response ? 'body' : 'headers',
                })
            )
            controller.abort()
            void reader?.cancel().catch(() => {})
        }, remaining)
    })

    const read = async () => {
        response = await ky.get(url, {
            headers: options.headers,
            next: options.next,
            fetch: options.fetch,
            retry: 0,
            timeout: false,
            signal: controller.signal,
            throwHttpErrors: false,
        })
        if (!response.ok) {
            throw new ContentApiRequestError('http', response.status)
        }

        // Encoded Content-Length may describe compressed bytes, not decoded bytes.
        const length = response.headers.get('content-length')
        const encoding = response.headers.get('content-encoding')
        if (
            options.maxBytes !== undefined &&
            (!encoding || encoding.toLowerCase() === 'identity') &&
            length !== null &&
            /^\d+$/.test(length) &&
            Number(length) > options.maxBytes
        ) {
            throw new ContentApiRequestError('too-large')
        }

        reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let text = ''
        let bytes = 0
        if (reader) {
            for (;;) {
                const chunk = await reader.read()
                if (chunk.done) break
                bytes += chunk.value.byteLength
                if (
                    options.maxBytes !== undefined &&
                    bytes > options.maxBytes
                ) {
                    throw new ContentApiRequestError('too-large')
                }
                text += decoder.decode(chunk.value, { stream: true })
            }
            text += decoder.decode()
        }
        if (!text.trim()) throw new ContentApiRequestError('empty')
        return { text, contentType: response.headers.get('content-type') }
    }

    try {
        return await Promise.race([read(), timeout])
    } catch (error) {
        // Ky network errors carry a Request (including auth headers). Do not log it.
        if (error instanceof ContentApiRequestError) throw error
        throw new ContentApiRequestError('network', undefined, {
            phase: response ? 'body' : 'headers',
            causeCode: readNetworkCode(error),
        })
    } finally {
        clearTimeout(timer)
        // Do not let stream cancellation prolong the caller's deadline.
        controller.abort()
        if (reader) void reader.cancel().catch(() => {})
        else void response?.body?.cancel().catch(() => {})
    }
}

export function isSameOriginPushRequest(request: Request): boolean {
    const url = new URL(request.url)
    // NextURL normalizes loopback hosts to localhost in development.
    if (
        process.env.NODE_ENV === 'development' &&
        url.hostname === 'localhost' &&
        request.headers.get('host') ===
            `127.0.0.1${url.port ? `:${url.port}` : ''}`
    ) {
        url.hostname = '127.0.0.1'
    }
    return (
        request.headers.get('origin') === url.origin &&
        request.headers.get('content-type')?.split(';')[0]?.trim() ===
            'application/json'
    )
}

export async function readPushRequestBody(request: Request): Promise<unknown> {
    if (!request.body) throw new Error('Missing body')
    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            length += value.byteLength
            if (length > 4096) {
                await reader.cancel()
                throw new Error('Body too large')
            }
            chunks.push(value)
        }
    } finally {
        reader.releaseLock()
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder().decode(bytes))
}

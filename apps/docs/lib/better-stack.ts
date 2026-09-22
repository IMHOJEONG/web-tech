type BetterStackConfig = {
    sourceToken?: string
    ingestingUrl?: string
    environment?: string
}

type DeliveryResult =
    | { status: 'disabled' | 'sent' | 'invalid-config' | 'failed' }
    | { status: 'rejected'; httpStatus: number }

// Direct server-side ingestion avoids a browser token and a Vercel Log Drain.
// Never retry on the request path or expose the token/response body in logs.
export async function sendBetterStackEvent(
    event: Record<string, unknown>,
    config: BetterStackConfig,
    options: { fetch?: typeof fetch; timeoutMs?: number } = {}
): Promise<DeliveryResult> {
    const token = config.sourceToken?.trim()
    const rawUrl = config.ingestingUrl?.trim()
    if (!token && !rawUrl) return { status: 'disabled' }
    if (!token || !rawUrl || !config.environment?.trim()) {
        return { status: 'invalid-config' }
    }

    let url: URL
    try {
        url = new URL(rawUrl)
        if (
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            url.search ||
            url.hash ||
            url.pathname !== '/'
        )
            return { status: 'invalid-config' }
    } catch {
        return { status: 'invalid-config' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(
        () => controller.abort(),
        options.timeoutMs ?? 1000
    )
    try {
        const response = await (options.fetch ?? fetch)(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...event,
                dt: new Date().toISOString(),
                service: 'docs',
                environment: config.environment.trim(),
            }),
            signal: controller.signal,
            redirect: 'error',
            cache: 'no-store',
        })
        // We only need the status; do not consume or log arbitrary response data.
        await response.body?.cancel()
        return response.ok
            ? { status: 'sent' }
            : { status: 'rejected', httpStatus: response.status }
    } catch {
        return { status: 'failed' }
    } finally {
        clearTimeout(timeout)
    }
}

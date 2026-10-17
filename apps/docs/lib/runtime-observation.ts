export const REQUEST_ID_HEADER = 'x-docs-request-id'

export function readRequestId(value: string | null | undefined) {
    return value &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value
        )
        ? value
        : null
}

export function redactPerformanceUrl(value: string): string | null {
    try {
        const url = new URL(value)
        if (!['https:', 'http:'].includes(url.protocol)) return null
        url.search = ''
        url.hash = ''
        url.username = ''
        url.password = ''
        if (/^\/(?:ko\/|en\/)?(?:api|lab)(?:\/|$)/.test(url.pathname))
            return null
        return url.toString()
    } catch {
        return null
    }
}

export function buildRuntimeErrorEvent(
    requestId: string | null,
    route: string,
    routeType: string
) {
    return {
        event: 'request-error',
        requestId,
        correlation: requestId ? 'available' : 'unavailable',
        route,
        routeType,
        outcome: 'error',
        durationScope: 'hook-only',
        durationMs: null,
    }
}

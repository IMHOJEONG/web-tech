import type { Instrumentation } from 'next'
import {
    buildRuntimeErrorEvent,
    readRequestId,
    REQUEST_ID_HEADER,
} from './lib/runtime-observation'

export const onRequestError: Instrumentation.onRequestError = (
    _error,
    request,
    context
) => {
    const value = request.headers[REQUEST_ID_HEADER]
    try {
        console.error(
            '[docs.runtime]',
            JSON.stringify(
                buildRuntimeErrorEvent(
                    readRequestId(typeof value === 'string' ? value : null),
                    context.routePath,
                    context.routeType
                )
            )
        )
    } catch {
        // Observability must not replace the framework's original error.
    }
}

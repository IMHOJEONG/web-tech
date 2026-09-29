import { AsyncLocalStorage } from 'node:async_hooks'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
    RequestLifecycle,
    type ErrorCategory,
    type LifecycleSummary,
} from './request-lifecycle.ts'

const storage = new AsyncLocalStorage<ReturnType<typeof observeRequest>>()

export function observeRequest(
    request: IncomingMessage,
    response: ServerResponse,
    sink: (summary: LifecycleSummary) => void,
    coverage: 'complete' | 'partial' = 'partial'
) {
    const state = new RequestLifecycle(
        request.url ?? '/',
        request.method ?? 'GET',
        request.headers,
        coverage
    )
    let deliveryFailures = 0
    const publish = () => {
        try {
            sink(state.snapshot())
        } catch {
            deliveryFailures++
        }
    }
    const error = (category: ErrorCategory, digest?: unknown) => {
        const id = state.error(
            category,
            digest,
            response.headersSent ? 'after-headers' : 'before-headers'
        )
        publish()
        return id
    }
    response.once('finish', () => {
        state.finish(response.statusCode, response.headersSent)
        publish()
    })
    response.once('close', () => {
        state.close(response.statusCode, response.headersSent)
        publish()
    })
    response.once('error', () => {
        error('transport')
    })
    publish()
    return {
        state,
        error,
        recover: (id: string) => {
            state.recover(id)
            publish()
        },
        cancel: () => {
            state.controlledCancel()
            publish()
        },
        deliveryFailures: () => deliveryFailures,
    }
}

export function withRequestObservation<T>(
    observation: ReturnType<typeof observeRequest>,
    action: () => T
): T {
    return storage.run(observation, action)
}

export function currentRequestObservation() {
    return storage.getStore()
}

export function bindResponseObservation(
    response: ServerResponse,
    observation: ReturnType<typeof observeRequest>
) {
    // HTTP events can originate outside the request's async context. Bind this
    // response, not the global prototype, including close-triggered errors.
    const emit = response.emit
    response.emit = function (
        this: ServerResponse,
        event: string,
        ...values: unknown[]
    ) {
        return withRequestObservation(observation, () =>
            Reflect.apply(emit, this, [event, ...values])
        )
    }
}

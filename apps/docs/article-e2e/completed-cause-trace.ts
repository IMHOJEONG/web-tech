import { expect } from '@playwright/test'

export type CauseTrace = {
    requestId: string
    responseFinished: boolean
    omitted: number
    deliveryFailures: number
    events: { sequence: number; event: string; detail: { status?: number } }[]
}

export async function completedCauseTrace(
    readTrace: () => Promise<CauseTrace>
): Promise<CauseTrace> {
    let result!: CauseTrace
    // Client EOF does not synchronize the server's finish listener/file write.
    // A close is terminal too: inspect it once, never wait for an abort to heal.
    await expect
        .poll(
            async () => {
                result = await readTrace()
                return result.events.some(
                    ({ event }) =>
                        event === 'response-finish' ||
                        event === 'response-close'
                )
            },
            {
                message:
                    'The request trace must record a terminal response event',
            }
        )
        .toBe(true)
    expect(result.responseFinished).toBe(true)
    expect(result.events.map(({ event }) => event)).toContain('response-finish')
    return result
}

export function assertUpstreamFailureTrace(
    result: CauseTrace,
    renderedSuccessfulBody: boolean
) {
    expect(result.omitted).toBe(0)
    expect(result.deliveryFailures).toBe(0)
    expect(result.responseFinished).toBe(true)
    expect(
        result.events.some(
            ({ event, detail }) =>
                event === 'upstream-headers' && detail.status === 503
        )
    ).toBe(true)
    expect(
        renderedSuccessfulBody,
        'The 503 control must fail the render, not return a stale successful article'
    ).toBe(false)
    const names = result.events.map(({ event }) => event)
    expect(names).toContain('console-warning')
    expect(names).toContain('console-error')
    expect(names).not.toContain('framework-stream-error')
}

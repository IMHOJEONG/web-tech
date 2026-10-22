import { randomUUID } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import type { Page, Request, Response } from '@playwright/test'

type Event = {
    event: string
    ms: number
    requestId?: number
    type?: string
    rsc?: boolean
    prefetch?: boolean
    status?: number
}

type ProgressSnapshot = {
    status: 'observed'
    clock: string
    samples: {
        event: 'initial' | 'change' | 'final'
        ms: number
        busy: boolean
    }[]
    droppedSamples: number
}

export async function observeNavigation(page: Page, destination: URL) {
    const started = performance.now()
    const events: Event[] = []
    const requests = new Map<Request, number>()
    const pending = new Set<number>()
    const failedResponses: number[] = []
    const documentRequests: string[] = []
    let droppedEvents = 0
    const key = `__offlineProgress_${randomUUID()}`
    const progressInstallStartedMs = performance.now() - started
    await page.evaluate((key) => {
        const root = document.documentElement
        const started = performance.now()
        const samples: ProgressSnapshot['samples'] = []
        let droppedSamples = 0
        let busy = root.classList.contains('nprogress-busy')
        const sample = (
            event: 'initial' | 'change' | 'final',
            value: boolean
        ) => {
            if (samples.length < (event === 'final' ? 100 : 99))
                samples.push({
                    event,
                    ms: performance.now() - started,
                    busy: value,
                })
            else droppedSamples++
        }
        sample('initial', busy)
        const changed = (records: MutationRecord[]) => {
            for (let index = 0; index < records.length; index++) {
                // oldValue of the next mutation preserves same-task on/off changes.
                const nextRecord = records[index + 1]
                const value = nextRecord
                    ? nextRecord.oldValue
                    : root.getAttribute('class')
                const next = (value ?? '')
                    .split(/\s+/)
                    .includes('nprogress-busy')
                if (next !== busy) {
                    busy = next
                    sample('change', busy)
                }
            }
        }
        const observer = new MutationObserver(changed)
        observer.observe(root, {
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true,
        })
        Reflect.set(window, key, () => {
            changed(observer.takeRecords())
            observer.disconnect()
            sample('final', root.classList.contains('nprogress-busy'))
            Reflect.deleteProperty(window, key)
            return {
                status: 'observed',
                clock: 'browser performance.now since observer installation',
                samples,
                droppedSamples,
            } satisfies ProgressSnapshot
        })
    }, key)
    const progressInstallFinishedMs = performance.now() - started
    const record = (event: Omit<Event, 'ms'>) => {
        if (events.length < 100)
            events.push({ ...event, ms: performance.now() - started })
        else droppedEvents++
    }
    const matches = (request: Request) => {
        const url = new URL(request.url())
        return (
            url.origin === destination.origin &&
            url.pathname === destination.pathname
        )
    }
    const identity = (request: Request) => {
        let id = requests.get(request)
        if (id === undefined) {
            id = requests.size + 1
            requests.set(request, id)
        }
        return {
            requestId: id,
            type: request.resourceType(),
            rsc: request.headers().rsc === '1',
            prefetch: request.headers()['next-router-prefetch'] === '1',
        }
    }
    const requested = (request: Request) => {
        if (!matches(request)) return
        const data = identity(request)
        pending.add(data.requestId)
        if (request.isNavigationRequest())
            documentRequests.push(destination.pathname)
        record({ event: 'request', ...data })
    }
    const responded = (response: Response) => {
        const request = response.request()
        if (!matches(request)) return
        const data = identity(request)
        pending.add(data.requestId)
        if (response.status() >= 400) failedResponses.push(response.status())
        record({
            event: 'response-headers',
            ...data,
            status: response.status(),
        })
    }
    const finished = (request: Request) => {
        if (!matches(request)) return
        const data = identity(request)
        pending.delete(data.requestId)
        record({ event: 'response-finished', ...data })
    }
    const failed = (request: Request) => {
        if (!matches(request)) return
        const data = identity(request)
        pending.delete(data.requestId)
        record({ event: 'request-failed', ...data })
    }
    page.on('request', requested)
    page.on('response', responded)
    page.on('requestfinished', finished)
    page.on('requestfailed', failed)
    return {
        events,
        failedResponses,
        documentRequests,
        mark: (event: string) => record({ event }),
        async stop() {
            page.off('request', requested)
            page.off('response', responded)
            page.off('requestfinished', finished)
            page.off('requestfailed', failed)
            let nprogress:
                | ProgressSnapshot
                | { status: 'unavailable'; reason: string }
            try {
                nprogress = await page.evaluate((key) => {
                    const stop = Reflect.get(window, key) as
                        | (() => ProgressSnapshot)
                        | undefined
                    return stop
                        ? stop()
                        : {
                              status: 'unavailable' as const,
                              reason: 'observer missing, including document replacement',
                          }
                }, key)
            } catch {
                nprogress = {
                    status: 'unavailable',
                    reason: 'page closed or evaluation failed',
                }
            }
            return {
                schemaVersion: 2,
                path: destination.pathname,
                clock: 'node performance.now since observation start',
                progressInstallation: {
                    startedMs: progressInstallStartedMs,
                    finishedMs: progressInstallFinishedMs,
                },
                events: [...events],
                droppedEvents,
                pendingRequestIds: [...pending],
                nprogress,
            }
        },
    }
}

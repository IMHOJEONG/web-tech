import type { Page } from '@playwright/test'

const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i

// Chromium-only, opt-in evidence. Do not record URLs, arbitrary headers or bodies.
export async function traceBrowserNetwork(page: Page) {
    const session = await page.context().newCDPSession(page)
    const requests = new Map<
        string,
        {
            path?: string
            clientProbeId?: string
            requestId?: string
            prefetch?: boolean
        }
    >()
    function entry(id: string) {
        let value = requests.get(id)
        if (!value) {
            value = {}
            requests.set(id, value)
        }
        return value
    }
    function emit(event: string, id: string, detail: object = {}) {
        const value = requests.get(id)
        if (!value?.path) return
        console.info(
            '[article-browser-network]',
            JSON.stringify({
                time: new Date().toISOString(),
                event,
                networkId: id,
                ...value,
                ...detail,
            })
        )
    }
    session.on('Network.requestWillBeSent', ({ requestId, request }) => {
        const url = new URL(request.url)
        if (
            url.origin !== 'http://127.0.0.1:3111' ||
            !/^\/(ko|en)\/docs\/web\/article-e2e-(remote|publication)$/.test(
                url.pathname
            )
        )
            return
        const value = entry(requestId)
        value.path = url.pathname
        value.prefetch = request.headers['next-router-prefetch'] === '1'
        emit('started', requestId)
    })
    session.on(
        'Network.requestWillBeSentExtraInfo',
        ({ requestId, headers }) => {
            const id = headers['x-article-client-probe']
            if (typeof id !== 'string' || !uuid.test(id)) return
            entry(requestId).clientProbeId = id
            emit('correlated', requestId)
        }
    )
    session.on('Network.responseReceived', ({ requestId, response }) => {
        const id = response.headers['x-article-request-id']
        if (typeof id === 'string' && uuid.test(id))
            entry(requestId).requestId = id
        emit('headers', requestId, { status: response.status })
    })
    session.on(
        'Network.loadingFailed',
        ({ requestId, canceled, errorText }) => {
            emit('failed', requestId, {
                canceled: canceled === true,
                aborted: errorText === 'net::ERR_ABORTED',
            })
        }
    )
    session.on('Network.loadingFinished', ({ requestId }) => {
        emit('finished', requestId)
    })
    await session.send('Network.enable')
    page.on('framenavigated', (frame) => {
        if (frame !== page.mainFrame()) return
        const url = new URL(frame.url())
        if (url.origin !== 'http://127.0.0.1:3111') return
        console.info(
            '[article-browser-network]',
            JSON.stringify({
                time: new Date().toISOString(),
                event: 'navigation',
                path: /^\/(ko|en)\/docs(?:\/web\/article-e2e-publication)?$/.test(
                    url.pathname
                )
                    ? url.pathname
                    : '/[redacted]',
            })
        )
    })
}

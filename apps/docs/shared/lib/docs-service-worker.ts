export class DocsServiceWorkerError extends Error {
    readonly code: 'activation' | 'activation-timeout' | 'worker-unavailable'

    constructor(code: DocsServiceWorkerError['code']) {
        super(code)
        this.name = 'DocsServiceWorkerError'
        this.code = code
    }
}

export async function getDocsServiceWorkerRegistration() {
    const registered = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
        updateViaCache: 'none',
    })
    // An update must not block an already usable registration in another tab.
    const worker =
        registered.active ?? registered.installing ?? registered.waiting
    if (!worker) throw new DocsServiceWorkerError('worker-unavailable')
    if (worker.state === 'activated') return registered
    await new Promise<void>((resolve, reject) => {
        const finish = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
                clearTimeout(timer)
                worker.removeEventListener('statechange', finish)
                if (worker.state === 'activated') resolve()
                else reject(new DocsServiceWorkerError('activation'))
            }
        }
        const timer = setTimeout(() => {
            worker.removeEventListener('statechange', finish)
            reject(new DocsServiceWorkerError('activation-timeout'))
        }, 8000)
        worker.addEventListener('statechange', finish)
        finish()
    })
    return registered
}

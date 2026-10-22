export async function getDocsServiceWorkerRegistration() {
    const registered = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
        updateViaCache: 'none',
    })
    const worker =
        registered.installing ?? registered.waiting ?? registered.active
    if (!worker) throw new Error('Service worker unavailable')
    if (worker.state === 'activated') return registered
    await new Promise<void>((resolve, reject) => {
        const finish = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
                clearTimeout(timer)
                worker.removeEventListener('statechange', finish)
                if (worker.state === 'activated') resolve()
                else reject(new Error('Service worker activation failed'))
            }
        }
        const timer = setTimeout(() => {
            worker.removeEventListener('statechange', finish)
            reject(new Error('Service worker activation timed out'))
        }, 8000)
        worker.addEventListener('statechange', finish)
        finish()
    })
    return registered
}

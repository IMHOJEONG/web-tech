import { getDocsServiceWorkerRegistration } from '../../../shared/lib/docs-service-worker.ts'

export type OfflineArticle = { path: string; title: string; savedAt: string }
export type OfflineSnapshot = {
    path: string
    title: string
    locale: 'ko' | 'en'
    body: string
    missingImages: number
}

export async function sendOfflineMessage(
    action: 'save' | 'list' | 'delete' | 'clear',
    options: { snapshot?: OfflineSnapshot; path?: string } = {},
    register = false
): Promise<OfflineArticle[]> {
    const registration = register
        ? await getDocsServiceWorkerRegistration()
        : await navigator.serviceWorker.getRegistration('/')
    const worker = registration?.active
    if (!worker) return []
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel()
        const timer = setTimeout(() => {
            channel.port1.close()
            reject(new Error('timeout'))
        }, 8000)
        channel.port1.onmessage = (event) => {
            clearTimeout(timer)
            channel.port1.close()
            if (event.data?.ok) resolve(event.data.articles)
            else reject(new Error(event.data?.error || 'storage'))
        }
        worker.postMessage(
            { channel: 'heap-forge-offline-v1', action, ...options },
            [channel.port2]
        )
    })
}

import {
    DocsServiceWorkerError,
    getDocsServiceWorkerRegistration,
} from '../../../shared/lib/docs-service-worker.ts'
import {
    isOfflineErrorCode,
    isOfflineErrorStage,
    OfflineOperationError,
} from './offline-error.ts'

export type OfflineArticle = { path: string; title: string; savedAt: string }
export type OfflineSnapshot = {
    path: string
    title: string
    locale: 'ko' | 'en'
    body: string
    missingImages: number
}

export function listenForOfflineArticleContext(path: string) {
    const respond = (event: MessageEvent) => {
        if (
            event.origin !== location.origin ||
            event.data?.channel !== 'heap-forge-offline-context-v1' ||
            event.data?.action !== 'current-article' ||
            !event.ports[0] ||
            !event.source ||
            !('scriptURL' in event.source)
        )
            return
        try {
            if (
                new URL(event.source.scriptURL).href !==
                new URL('/push-sw.js', location.origin).href
            )
                return
        } catch {
            return
        }
        const current = location.pathname
        event.ports[0].postMessage({
            ok: current === path,
            path: current === path ? current : undefined,
        })
        event.ports[0].close()
    }
    navigator.serviceWorker.addEventListener('message', respond)
    return () => navigator.serviceWorker.removeEventListener('message', respond)
}

export async function sendOfflineMessage(
    action: 'save' | 'list' | 'delete' | 'clear',
    options: { snapshot?: OfflineSnapshot; path?: string } = {},
    register = false
): Promise<OfflineArticle[]> {
    let registration: ServiceWorkerRegistration | undefined
    try {
        registration = register
            ? await getDocsServiceWorkerRegistration()
            : await navigator.serviceWorker.getRegistration('/')
    } catch (error) {
        if (error instanceof DocsServiceWorkerError)
            throw new OfflineOperationError(
                error.code,
                error.code === 'worker-unavailable'
                    ? 'registration'
                    : 'activation'
            )
        throw new OfflineOperationError('registration', 'registration')
    }
    const worker = registration?.active
    if (!worker) {
        if (action === 'list' && !register) return []
        throw new OfflineOperationError('worker-unavailable', 'registration')
    }
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel()
        const finish = (
            error?: OfflineOperationError,
            articles?: OfflineArticle[]
        ) => {
            clearTimeout(timer)
            channel.port1.onmessage = null
            channel.port1.onmessageerror = null
            channel.port1.close()
            if (error) reject(error)
            else resolve(articles!)
        }
        const timer = setTimeout(() => {
            finish(new OfflineOperationError('message-timeout', 'message'))
        }, 8000)
        channel.port1.onmessage = (event) => {
            const reply = event.data
            if (
                reply?.ok === true &&
                Array.isArray(reply.articles) &&
                reply.articles.every(
                    (article: OfflineArticle) =>
                        article &&
                        typeof article.path === 'string' &&
                        typeof article.title === 'string' &&
                        typeof article.savedAt === 'string'
                )
            ) {
                finish(undefined, reply.articles)
            } else if (reply?.ok === false && isOfflineErrorCode(reply.error)) {
                finish(
                    new OfflineOperationError(
                        reply.error,
                        isOfflineErrorStage(reply.stage)
                            ? reply.stage
                            : 'unknown'
                    )
                )
            } else
                finish(new OfflineOperationError('message-invalid', 'message'))
        }
        channel.port1.onmessageerror = () =>
            finish(new OfflineOperationError('message-invalid', 'message'))
        try {
            worker.postMessage(
                { channel: 'heap-forge-offline-v1', action, ...options },
                [channel.port2]
            )
        } catch {
            channel.port2.close()
            finish(new OfflineOperationError('message-send', 'message'))
        }
    })
}

// Explicit public-article snapshots only. Never cache API, RSC or navigation responses.
const OFFLINE_ARTICLES = 'heap-forge-offline-articles-v1'
const OFFLINE_SHELL = 'heap-forge-offline-shell-v1'
const OFFLINE_FILES = [
    '/offline.html',
    '/offline-reader.js',
    '/offline-reader.css',
]
const OFFLINE_LIMIT = 10
const OFFLINE_BYTES = 2 * 1024 * 1024
let offlineMutation = Promise.resolve()

function offlineArticlePath(value) {
    try {
        const url = new URL(value, self.location.origin)
        return url.origin === self.location.origin &&
            !url.search &&
            !url.hash &&
            /^\/(ko|en)\/docs\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/.test(
                url.pathname
            )
            ? url.pathname
            : null
    } catch {
        return null
    }
}

function offlineEscape(value) {
    return String(value).replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character]
    )
}

function offlineSnapshotDocument(snapshot, savedAt) {
    const english = snapshot.locale === 'en'
    const heading = /<h1(?:\s|>)/i.test(snapshot.body)
        ? ''
        : `<h1>${offlineEscape(snapshot.title)}</h1>`
    return `<!doctype html>
<html lang="${english ? 'en' : 'ko'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${offlineEscape(snapshot.title)} · HEAP-FORGE</title><link rel="stylesheet" href="/offline-reader.css"></head>
<body><header>
<a href="/offline.html?lang=${english ? 'en' : 'ko'}">HEAP-FORGE / ${english ? 'Saved articles' : '저장한 글'}</a>
<p>${english ? 'Offline snapshot, not the latest live version' : '오프라인 저장본이며 최신 원문과 다를 수 있습니다'} · <time>${offlineEscape(savedAt)}</time></p>
<p>${english ? 'Images not saved' : '저장되지 않은 이미지'}: ${snapshot.missingImages}</p>
<a href="${offlineEscape(snapshot.path)}">${english ? 'Open live article (connection required)' : '원문 열기 (인터넷 연결 필요)'}</a>
</header><main>${heading}${snapshot.body}</main></body></html>`
}

async function offlineList(cache) {
    const entries = []
    for (const request of await cache.keys()) {
        const response = await cache.match(request)
        if (!response) continue
        entries.push({
            path: new URL(request.url).pathname,
            title: decodeURIComponent(
                response.headers.get('X-Offline-Title') || ''
            ),
            savedAt: response.headers.get('X-Offline-Saved-At'),
        })
    }
    return entries.sort((a, b) =>
        (b.savedAt || '').localeCompare(a.savedAt || '')
    )
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(OFFLINE_SHELL)
            await cache.addAll(OFFLINE_FILES)
            await self.skipWaiting()
        })()
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            for (const key of await caches.keys()) {
                if (
                    key.startsWith('heap-forge-offline-shell-') &&
                    key !== OFFLINE_SHELL
                )
                    await caches.delete(key)
            }
            await self.clients.claim()
        })()
    )
})

self.addEventListener('message', (event) => {
    if (!event.ports?.[0] || event.data?.channel !== 'heap-forge-offline-v1')
        return
    const port = event.ports[0]
    const run = async () => {
        try {
            const client = event.source?.id
                ? await self.clients.get(event.source.id)
                : null
            if (!client) throw new Error('source')
            const source = new URL(client.url)
            const sourcePath = offlineArticlePath(
                source.origin + source.pathname
            )
            if (
                source.origin !== self.location.origin ||
                (!sourcePath && source.pathname !== '/offline.html')
            )
                throw new Error('source')
            const cache = await caches.open(OFFLINE_ARTICLES)
            const { action, snapshot, path } = event.data
            if (action === 'list') {
                port.postMessage({
                    ok: true,
                    articles: await offlineList(cache),
                })
                return
            }
            if (action === 'clear') {
                for (const request of await cache.keys())
                    await cache.delete(request)
            } else if (action === 'delete') {
                const safePath = offlineArticlePath(path)
                if (!safePath) throw new Error('path')
                await cache.delete(self.location.origin + safePath)
            } else if (action === 'save') {
                const safePath = offlineArticlePath(snapshot?.path)
                if (
                    !safePath ||
                    safePath !== sourcePath ||
                    !['ko', 'en'].includes(snapshot.locale) ||
                    !safePath.startsWith(`/${snapshot.locale}/docs/`) ||
                    typeof snapshot.title !== 'string' ||
                    !snapshot.title.trim() ||
                    snapshot.title.length > 300 ||
                    typeof snapshot.body !== 'string' ||
                    !snapshot.body.trim() ||
                    !Number.isInteger(snapshot.missingImages) ||
                    snapshot.missingImages < 0
                )
                    throw new Error('snapshot')
                const key = self.location.origin + safePath
                if (
                    !(await cache.match(key)) &&
                    (await cache.keys()).length >= OFFLINE_LIMIT
                )
                    throw new Error('limit')
                const savedAt = new Date().toISOString()
                const html = offlineSnapshotDocument(snapshot, savedAt)
                if (new TextEncoder().encode(html).length > OFFLINE_BYTES)
                    throw new Error('size')
                await cache.put(
                    key,
                    new Response(html, {
                        headers: {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Content-Security-Policy':
                                "default-src 'none'; style-src 'self'; img-src data:; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
                            'X-Content-Type-Options': 'nosniff',
                            'Cache-Control': 'no-store',
                            'X-Offline-Title': encodeURIComponent(
                                snapshot.title
                            ),
                            'X-Offline-Saved-At': savedAt,
                        },
                    })
                )
            } else throw new Error('action')
            port.postMessage({ ok: true, articles: await offlineList(cache) })
        } catch (error) {
            const known = [
                'source',
                'path',
                'snapshot',
                'limit',
                'size',
                'action',
            ]
            port.postMessage({
                ok: false,
                error: known.includes(error.message)
                    ? error.message
                    : 'storage',
            })
        }
    }
    // Serialize writes so simultaneous tabs cannot exceed the quota or lose updates.
    const task = offlineMutation.then(run)
    offlineMutation = task.catch(() => {})
    event.waitUntil(task)
})

async function offlineShell() {
    const cache = await caches.open(OFFLINE_SHELL)
    return (
        (await cache.match('/offline.html')) ||
        new Response(
            'Offline reader unavailable. Reconnect to save an article.',
            { status: 503 }
        )
    )
}

self.addEventListener('fetch', (event) => {
    const request = event.request
    const url = new URL(request.url)
    if (request.method !== 'GET' || url.origin !== self.location.origin) return
    if (url.pathname === '/offline.html') {
        event.respondWith(
            (async () => {
                const article = url.searchParams.get('article')
                if (!article) return offlineShell()
                const path = offlineArticlePath(article)
                if (path) {
                    const saved = await (
                        await caches.open(OFFLINE_ARTICLES)
                    ).match(self.location.origin + path)
                    if (saved) return saved
                }
                return offlineShell()
            })()
        )
        return
    }
    if (OFFLINE_FILES.includes(url.pathname)) {
        event.respondWith(
            (async () =>
                (await (
                    await caches.open(OFFLINE_SHELL)
                ).match(url.pathname)) || fetch(request))()
        )
        return
    }
    const articlePath = offlineArticlePath(url.origin + url.pathname)
    const publicEntry =
        /^\/(?:ko|en)(?:\/(?:feed|docs|web|mobile|ui-ux|about))?\/?$/.test(
            url.pathname
        ) || url.pathname === '/'
    if (request.mode !== 'navigate' || (!articlePath && !publicEntry)) return
    event.respondWith(
        (async () => {
            try {
                return await fetch(request)
            } catch {
                const saved = articlePath
                    ? await (
                          await caches.open(OFFLINE_ARTICLES)
                      ).match(self.location.origin + articlePath)
                    : null
                return saved || offlineShell()
            }
        })()
    )
})

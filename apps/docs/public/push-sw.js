// Push-only worker: no fetch handler or offline cache.
self.addEventListener('push', (event) => {
    if (!event.data) return
    let data
    try {
        data = event.data.json()
    } catch {
        return
    }
    if (
        !data ||
        typeof data.title !== 'string' ||
        typeof data.body !== 'string'
    )
        return
    event.waitUntil(
        self.registration.showNotification(data.title.slice(0, 80), {
            body: data.body.slice(0, 240),
            icon: '/favicon.png',
            tag: 'heap-forge-push-test',
            data: { url: typeof data.url === 'string' ? data.url : '/about' },
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    let destination = new URL('/about', self.location.origin).href
    try {
        const candidate = new URL(
            event.notification.data?.url || '/about',
            self.location.origin
        )
        if (
            candidate.origin === self.location.origin &&
            /^\/(?:ko\/|en\/)?(?:about|docs)(?:\/|$)/.test(candidate.pathname)
        ) {
            destination = candidate.href
        }
    } catch {
        // Malformed notification links must never break the fallback navigation.
    }
    event.waitUntil(self.clients.openWindow(destination))
})

import { createServer } from 'node:http'
import { setTimeout } from 'node:timers/promises'

let publicationVersion = 1

// Synthetic credential and content, never an operational token or NAS document.
const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store')
    if (request.url === '/health') {
        response.end('ready')
        return
    }
    // Test-only control plane, bound to loopback and never mounted in Next.js.
    if (request.url?.startsWith('/__test/publication/')) {
        if (
            request.method !== 'POST' ||
            request.headers.authorization !== 'Bearer article-e2e-only-control'
        ) {
            response.writeHead(401).end('Unauthorized')
            return
        }
        const version = request.url.slice('/__test/publication/'.length)
        if (version !== '1' && version !== '2') {
            response.writeHead(400).end('Invalid version')
            return
        }
        publicationVersion = Number(version)
        response.writeHead(204).end()
        return
    }
    if (request.headers.authorization !== 'Bearer article-e2e-only-token') {
        response.writeHead(401).end('Unauthorized')
        return
    }
    if (request.url === '/api/posts') {
        response.setHeader('Content-Type', 'application/json')
        response.end(
            JSON.stringify({
                results: [
                    {
                        id: 'article-e2e-remote',
                        slug: 'article-e2e-remote',
                        markdownPath: 'web/article-e2e-remote',
                        title: 'Remote article rendering probe',
                        summary:
                            'A deterministic remote article for browser regression tests.',
                        date: '2026-09-18',
                        status: 'published',
                    },
                    {
                        id: 'article-e2e-publication',
                        slug: 'article-e2e-publication',
                        markdownPath: 'web/article-e2e-publication',
                        title: `Publication cache probe V${publicationVersion}`,
                        summary: `PUBLICATION_SUMMARY_V${publicationVersion}`,
                        // Keep the synthetic document on the first index page.
                        date: '2099-01-01',
                        status: 'published',
                    },
                ],
            })
        )
        return
    }
    if (request.url === '/posts/web/article-e2e-publication') {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(`<article>
            <h1>Publication cache probe V${publicationVersion}</h1>
            <p>PUBLICATION_BODY_V${publicationVersion}</p>
            <h2>Publication ending</h2>
            <p>PUBLICATION_END_V${publicationVersion}</p>
        </article>`)
        return
    }
    if (request.url === '/posts/web/article-e2e-remote') {
        // Exercise async server rendering; the index never contains body text.
        await setTimeout(350)
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(`<article>
            <h1>Remote article rendering probe</h1>
            <p>This paragraph came from the authenticated body endpoint.</p>
            <h2>Final remote section</h2>
            <p>The remote article has finished rendering.</p>
        </article>`)
        return
    }
    response.writeHead(404).end('Not found')
})

server.listen(3112, '127.0.0.1')
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
        server.close()
        server.closeAllConnections()
    })
}

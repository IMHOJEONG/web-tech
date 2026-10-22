import { createServer } from 'node:http'
import { setTimeout } from 'node:timers/promises'

let publicationVersion = 1
let releaseRemoteBody: (() => void) | undefined
let remoteBodyGate: Promise<void> | undefined
let remoteBodyStatus = 200

const taxonomyBodies = new Map(
    ['web', 'ui-ux', 'mobile'].map((channel) => [
        `/posts/${channel}/taxonomy-fixture`,
        `<article><h1>Taxonomy fixture ${channel}</h1>
            <p>Synthetic canonical channel regression document.</p>
            <h2>Fixture ending</h2><p>Taxonomy fixture body complete.</p></article>`,
    ])
)

// Synthetic credential and content, never an operational token or NAS document.
const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'private, no-store')
    if (request.url === '/health') {
        response.end('ready')
        return
    }
    if (request.url?.startsWith('/__test/remote-body/')) {
        if (
            request.method !== 'POST' ||
            request.headers.authorization !== 'Bearer article-e2e-only-control'
        ) {
            response.writeHead(401).end('Unauthorized')
            return
        }
        if (request.url === '/__test/remote-body/hold') {
            remoteBodyStatus = 200
            releaseRemoteBody?.()
            remoteBodyGate = new Promise<void>((resolve) => {
                releaseRemoteBody = resolve
            })
        } else if (request.url === '/__test/remote-body/release') {
            remoteBodyStatus = 200
            releaseRemoteBody?.()
            releaseRemoteBody = undefined
            remoteBodyGate = undefined
        } else if (request.url === '/__test/remote-body/fail-503') {
            remoteBodyStatus = 503
            releaseRemoteBody?.()
            releaseRemoteBody = undefined
            remoteBodyGate = undefined
        } else {
            response.writeHead(404).end('Not found')
            return
        }
        response.writeHead(204).end()
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
                    ...['web', 'ui-ux', 'mobile'].map((channel) => ({
                        id: `${channel}/taxonomy-fixture`,
                        slug: 'taxonomy-fixture',
                        markdownPath: `${channel}/taxonomy-fixture`,
                        fileName: `remote/${channel}/taxonomy-fixture`,
                        title: `Taxonomy fixture ${channel}`,
                        summary:
                            'Synthetic canonical channel regression document.',
                        date: '2099-01-02',
                        status: 'published',
                    })),
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
    const taxonomyBody = taxonomyBodies.get(request.url ?? '')
    if (taxonomyBody) {
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(taxonomyBody)
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
        if (remoteBodyStatus === 503) {
            response.writeHead(503).end('Synthetic upstream unavailable')
            return
        }
        // Exercise async server rendering; the index never contains body text.
        await remoteBodyGate
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

import { createServer } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import { articleFixtureAuthorization } from './fixture-credentials.ts'

let publicationVersion = 1
let publicationGate: Promise<void> | undefined
let releasePublication: (() => void) | undefined
let publicationPending = 0
let publicationReceived = 0
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
            request.headers.authorization !==
                articleFixtureAuthorization('control')
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
            request.url === '/__test/publication/state' &&
            request.method === 'GET' &&
            request.headers.authorization ===
                articleFixtureAuthorization('control')
        ) {
            response.setHeader('Content-Type', 'application/json')
            response.end(
                JSON.stringify({
                    publicationVersion,
                    pending: publicationPending,
                    received: publicationReceived,
                })
            )
            return
        }
        if (
            request.method !== 'POST' ||
            request.headers.authorization !==
                articleFixtureAuthorization('control')
        ) {
            response.writeHead(401).end('Unauthorized')
            return
        }
        const version = request.url.slice('/__test/publication/'.length)
        if (version === 'reset') {
            releasePublication?.()
            publicationGate = undefined
            releasePublication = undefined
            publicationVersion = 1
            response.writeHead(204).end()
            return
        }
        if (version === 'hold-body' || version === 'release-body') {
            releasePublication?.()
            publicationGate =
                version === 'hold-body'
                    ? new Promise<void>((resolve) => {
                          releasePublication = resolve
                      })
                    : undefined
            if (version === 'release-body') releasePublication = undefined
            response.writeHead(204).end()
            return
        }
        if (version !== '1' && version !== '2') {
            response.writeHead(400).end('Invalid version')
            return
        }
        publicationVersion = Number(version)
        response.writeHead(204).end()
        return
    }
    if (
        request.headers.authorization !== articleFixtureAuthorization('content')
    ) {
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
                        searchText: `Publication cache probe V${publicationVersion} PUBLICATION_BODY_V${publicationVersion} bodyonlypublicationv${publicationVersion}needle Publication ending PUBLICATION_END_V${publicationVersion}`,
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
        const version = publicationVersion
        publicationReceived++
        publicationPending++
        try {
            await publicationGate
        } finally {
            publicationPending--
        }
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(`<article>
            <h1>Publication cache probe V${version}</h1>
            <p>PUBLICATION_BODY_V${version}</p>
            <p>bodyonlypublicationv${version}needle</p>
            <h2>Publication ending</h2>
            <p>PUBLICATION_END_V${version}</p>
        </article>`)
        return
    }
    if (request.url === '/posts/web/article-e2e-remote') {
        if (remoteBodyStatus === 503) {
            response.writeHead(503).end('Synthetic upstream unavailable')
            return
        }
        // This gated article intentionally has no search text in its index entry.
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

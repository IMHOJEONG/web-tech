import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { expect, type Page, type Route } from '@playwright/test'

/** Replay real HTML unchanged, holding streamed segments and Flight completion. */
export async function holdDocsIndexCompletion(page: Page, target: string) {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
        release = resolve
    })
    let prefix = ''
    let suffix = ''
    const server = createServer(async (_request, response) => {
        response.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-store',
        })
        response.write(prefix)
        await gate
        response.end(suffix)
    })
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })
    const { port } = server.address() as AddressInfo
    const match = (url: URL) => url.href === target
    const handler = async (route: Route) => {
        const response = await route.fetch()
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('text/html')
        const html = await response.text()
        const boundary = html.indexOf('<div hidden id="S:')
        expect(boundary).toBeGreaterThan(0)
        prefix = html.slice(0, boundary)
        suffix = html.slice(boundary)
        expect(prefix).toContain('data-page-pending="docs"')
        expect(prefix).not.toContain('data-testid="docs-index-results"')
        expect(suffix).toContain('data-testid="docs-index-results"')
        await route.continue({ url: `http://127.0.0.1:${port}/` })
    }
    await page.route(match, handler, { times: 1 })
    return {
        release,
        async dispose() {
            release()
            try {
                if (!page.isClosed()) await page.unroute(match, handler)
            } finally {
                server.closeAllConnections()
                await new Promise<void>((resolve, reject) => {
                    server.close((error) => (error ? reject(error) : resolve()))
                })
            }
        },
    }
}

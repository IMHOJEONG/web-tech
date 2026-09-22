import { connection } from 'next/server'
import { cacheLife, cacheTag } from 'next/cache'
import { REMOTE_CONTENT_CACHE_TAG } from '~/lib/content-cache'
import {
    fetchRemoteDocByRoutePath,
    fetchRemoteDocsData,
} from '~/lib/content-api'

export { POST } from '~/scripts/fixtures/cache-probe'

async function readIndex() {
    'use cache'
    cacheLife({ stale: 0, revalidate: 3600, expire: 7200 })
    cacheTag(REMOTE_CONTENT_CACHE_TAG)
    return fetchRemoteDocsData()
}

async function readDocument() {
    'use cache'
    cacheLife({ stale: 0, revalidate: 3600, expire: 7200 })
    cacheTag(REMOTE_CONTENT_CACHE_TAG)
    return fetchRemoteDocByRoutePath('feed/cache-probe')
}

// Keep the response dynamic so the experiment observes function/data caches.
export async function GET() {
    await connection()
    const index = await readIndex()
    const document = await readDocument()
    return Response.json(
        { index, document },
        {
            headers: { 'Cache-Control': 'no-store' },
        }
    )
}

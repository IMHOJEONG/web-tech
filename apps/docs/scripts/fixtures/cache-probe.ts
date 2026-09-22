import { connection } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
    isValidContentRevalidationToken,
    REMOTE_CONTENT_CACHE_TAG,
} from '~/lib/content-cache'
import {
    fetchRemoteDocByRoutePath,
    fetchRemoteDocsData,
} from '~/lib/content-api'

// Copied into the temporary app only; never exposed by the production app.
export async function GET() {
    await connection()
    const index = await fetchRemoteDocsData()
    const document = await fetchRemoteDocByRoutePath('feed/cache-probe')
    return Response.json(
        { index, document },
        {
            headers: { 'Cache-Control': 'no-store' },
        }
    )
}

// Test-only comparison endpoint; production keeps its expire: 0 policy.
export async function POST(request: Request) {
    if (
        !isValidContentRevalidationToken(
            request.headers.get('authorization'),
            process.env.BLOG_CONTENT_REVALIDATE_TOKEN
        )
    ) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 })
    }
    revalidateTag(REMOTE_CONTENT_CACHE_TAG, 'max')
    return Response.json(
        { revalidated: true },
        {
            headers: { 'Cache-Control': 'no-store' },
        }
    )
}

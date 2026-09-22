import { revalidateTag } from 'next/cache'
import {
    isValidContentRevalidationToken,
    REMOTE_CONTENT_CACHE_TAG,
} from '~/lib/content-cache'

const NO_STORE_HEADERS = {
    'Cache-Control': 'private, no-store',
}

export async function POST(request: Request) {
    const configuredToken = process.env.BLOG_CONTENT_REVALIDATE_TOKEN
    const isAuthorized = isValidContentRevalidationToken(
        request.headers.get('authorization'),
        configuredToken
    )

    if (!isAuthorized) {
        if (!configuredToken?.trim()) {
            console.error(
                '[docs] Content revalidation rejected because its token is not configured.'
            )
        }

        return Response.json(
            { message: 'Unauthorized' },
            { status: 401, headers: NO_STORE_HEADERS }
        )
    }

    revalidateTag(REMOTE_CONTENT_CACHE_TAG, { expire: 0 })

    const revalidatedAt = new Date().toISOString()

    console.info('[docs] Remote content cache invalidated.', {
        tag: REMOTE_CONTENT_CACHE_TAG,
        revalidatedAt,
    })

    return Response.json(
        {
            revalidated: true,
            revalidatedAt,
        },
        { headers: NO_STORE_HEADERS }
    )
}

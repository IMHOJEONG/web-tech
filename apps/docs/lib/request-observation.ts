import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { createArticleTiming } from './article-timing'
import { readRequestId, REQUEST_ID_HEADER } from './runtime-observation'

// Read only from request-bound loaders; this opts their routes into dynamic rendering.
export const getRequestObservation = cache(async () => {
    const requestHeaders = await headers()
    const requestId = readRequestId(requestHeaders.get(REQUEST_ID_HEADER))
    const measure = createArticleTiming(undefined, undefined, { requestId })
    return { requestId, measure }
})

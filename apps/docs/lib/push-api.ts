import 'server-only'
import ky from 'ky'
import { z } from 'zod'
import { pushAccessFailure } from './push-access'
import {
    isSameOriginPushRequest,
    readPushRequestBody,
} from './push-request-policy'

const headers = { 'Cache-Control': 'private, no-store' }
const publicConfigSchema = z.object({
    publicKey: z.string().regex(/^[A-Za-z0-9_-]{87}$/),
})

function client() {
    if (process.env.BLOG_PUSH_ENABLED !== 'true') return null
    const base = process.env.BLOG_PUSH_API_BASE_URL?.trim()
    const token = process.env.BLOG_PUSH_API_TOKEN?.trim()
    if (!base || !token) return null
    const url = new URL(base)
    if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (url.protocol !== 'https:' &&
            !(
                url.protocol === 'http:' &&
                ['localhost', '127.0.0.1'].includes(url.hostname)
            ))
    )
        return null
    return ky.create({
        prefix: `${url.href.replace(/\/$/, '')}/api/push/`,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
        retry: 0,
        redirect: 'error',
        cache: 'no-store',
    })
}

export async function getPushConfig(request: Request) {
    const failure = pushAccessFailure(request)
    if (failure) return failure
    try {
        const api = client()
        if (!api)
            return Response.json(
                { message: 'Unavailable' },
                { status: 503, headers }
            )
        const result = publicConfigSchema.parse(await api.get('config').json())
        return Response.json(result, { headers })
    } catch {
        return Response.json(
            { message: 'Unavailable' },
            { status: 503, headers }
        )
    }
}

export async function updatePushSubscription(
    request: Request,
    method: 'POST' | 'DELETE'
) {
    if (!isSameOriginPushRequest(request))
        return Response.json({ message: 'Forbidden' }, { status: 403, headers })
    const failure = pushAccessFailure(request)
    if (failure) return failure
    let body: unknown
    try {
        body = await readPushRequestBody(request)
    } catch {
        return Response.json(
            { message: 'Invalid request' },
            { status: 400, headers }
        )
    }
    try {
        const api = client()
        if (!api)
            return Response.json(
                { message: 'Unavailable' },
                { status: 503, headers }
            )
        await api('subscriptions', { method, json: body })
        return Response.json({ subscribed: method === 'POST' }, { headers })
    } catch (error) {
        const status =
            error instanceof Error &&
            'response' in error &&
            error.response instanceof Response
                ? error.response.status
                : 503
        const publicStatus = [400, 429].includes(status) ? status : 503
        console.warn('[docs] Push subscription update failed.', {
            method,
            status: publicStatus,
        })
        return Response.json(
            { message: 'Unable to update subscription' },
            { status: publicStatus, headers }
        )
    }
}

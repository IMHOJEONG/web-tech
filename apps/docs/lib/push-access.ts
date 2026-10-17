import 'server-only'
import { NextResponse } from 'next/server'
import {
    createPushAccessSession,
    isPushAccessReady,
    matchesPushInvite,
    PUSH_ACCESS_COOKIE,
    PUSH_ACCESS_TTL_SECONDS,
    readPushAccessCookie,
    verifyPushAccessSession,
    type PushAccessSettings,
} from './push-access-policy'
import {
    isSameOriginPushRequest,
    readPushRequestBody,
} from './push-request-policy'

const headers = { 'Cache-Control': 'private, no-store' }

function settings(): PushAccessSettings {
    return {
        enabled: process.env.BLOG_PUSH_ENABLED === 'true',
        production: process.env.NODE_ENV === 'production',
        wafVerified: process.env.BLOG_PUSH_WAF_VERIFIED === 'true',
        inviteCode: process.env.BLOG_PUSH_INVITE_CODE?.trim() ?? '',
        sessionSecret: process.env.BLOG_PUSH_SESSION_SECRET?.trim() ?? '',
        apiToken: process.env.BLOG_PUSH_API_TOKEN?.trim() ?? '',
    }
}

export function pushAccessFailure(request: Request): Response | null {
    const config = settings()
    if (!isPushAccessReady(config))
        return Response.json(
            { message: 'Unavailable' },
            { status: 503, headers }
        )
    if (!verifyPushAccessSession(readPushAccessCookie(request), config)) {
        return Response.json(
            { message: 'Unauthorized' },
            { status: 401, headers }
        )
    }
    return null
}

export function getPushAccess(request: Request) {
    const failure = pushAccessFailure(request)
    if (failure?.status === 503) return failure
    return Response.json({ authorized: failure === null }, { headers })
}

export async function authorizePushAccess(request: Request) {
    if (!isSameOriginPushRequest(request))
        return Response.json({ message: 'Forbidden' }, { status: 403, headers })
    const config = settings()
    if (
        !isPushAccessReady(config) ||
        (config.production && new URL(request.url).protocol !== 'https:')
    ) {
        return Response.json(
            { message: 'Unavailable' },
            { status: 503, headers }
        )
    }
    let code: unknown
    try {
        const body: unknown = await readPushRequestBody(request)
        if (!body || typeof body !== 'object' || !('code' in body))
            throw new Error('Invalid request')
        code = body.code
    } catch {
        return Response.json(
            { message: 'Invalid request' },
            { status: 400, headers }
        )
    }
    if (!matchesPushInvite(code, config.inviteCode))
        return Response.json(
            { message: 'Unauthorized' },
            { status: 401, headers }
        )
    const response = NextResponse.json({ authorized: true }, { headers })
    response.cookies.set(PUSH_ACCESS_COOKIE, createPushAccessSession(config), {
        httpOnly: true,
        secure: config.production || new URL(request.url).protocol === 'https:',
        sameSite: 'strict',
        path: '/api/push',
        maxAge: PUSH_ACCESS_TTL_SECONDS,
    })
    return response
}

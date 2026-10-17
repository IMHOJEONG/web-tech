import {
    createHash,
    createHmac,
    randomBytes,
    timingSafeEqual,
} from 'node:crypto'

export const PUSH_ACCESS_TTL_SECONDS = 3600
export const PUSH_ACCESS_COOKIE = 'heap-forge-push-access'

export interface PushAccessSettings {
    enabled: boolean
    production: boolean
    wafVerified: boolean
    inviteCode: string
    sessionSecret: string
    apiToken: string
}

const secretPattern = /^[A-Za-z0-9_-]{32,128}$/

export function isPushAccessReady(settings: PushAccessSettings): boolean {
    return (
        settings.enabled &&
        (!settings.production || settings.wafVerified) &&
        secretPattern.test(settings.inviteCode) &&
        secretPattern.test(settings.sessionSecret) &&
        settings.inviteCode !== settings.sessionSecret &&
        settings.inviteCode !== settings.apiToken &&
        settings.sessionSecret !== settings.apiToken
    )
}

export function matchesPushInvite(
    supplied: unknown,
    expected: string
): boolean {
    if (typeof supplied !== 'string' || !secretPattern.test(supplied))
        return false
    return timingSafeEqual(
        createHash('sha256').update(supplied).digest(),
        createHash('sha256').update(expected).digest()
    )
}

function signature(body: string, settings: PushAccessSettings): string {
    const inviteVersion = createHash('sha256')
        .update(settings.inviteCode)
        .digest('hex')
    return createHmac('sha256', settings.sessionSecret)
        .update(`heap-forge:push-access:v1:${inviteVersion}:${body}`)
        .digest('base64url')
}

export function createPushAccessSession(
    settings: PushAccessSettings,
    now = Date.now()
): string {
    if (!isPushAccessReady(settings)) throw new Error('Unavailable')
    const expires = Math.floor(now / 1000) + PUSH_ACCESS_TTL_SECONDS
    const body = `${expires}.${randomBytes(16).toString('base64url')}`
    return `${body}.${signature(body, settings)}`
}

export function verifyPushAccessSession(
    value: string | null,
    settings: PushAccessSettings,
    now = Date.now()
): boolean {
    if (!isPushAccessReady(settings) || !value || value.length > 128)
        return false
    const parts =
        /^(\d{10,12})\.([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(value)
    if (!parts) return false
    const [, expires, nonce, supplied] = parts
    if (!expires || !nonce || !supplied) return false
    const deadline = Number(expires)
    const seconds = Math.floor(now / 1000)
    if (
        !Number.isSafeInteger(deadline) ||
        deadline <= seconds ||
        deadline > seconds + PUSH_ACCESS_TTL_SECONDS
    )
        return false
    const expected = signature(`${expires}.${nonce}`, settings)
    return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
}

export function readPushAccessCookie(request: Request): string | null {
    const matches = (request.headers.get('cookie') ?? '')
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.startsWith(`${PUSH_ACCESS_COOKIE}=`))
    const entry = matches.length === 1 ? matches[0] : undefined
    return entry ? entry.slice(PUSH_ACCESS_COOKIE.length + 1) : null
}

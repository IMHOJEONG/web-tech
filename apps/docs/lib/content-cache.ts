import { timingSafeEqual } from 'node:crypto'

export const REMOTE_CONTENT_CACHE_TAG = 'docs-content:remote'

export function isValidContentRevalidationToken(
    authorization: string | null,
    configuredToken?: string
) {
    const expectedToken = configuredToken?.trim()

    if (!expectedToken || !authorization) {
        return false
    }

    const [scheme, token, extra] = authorization.trim().split(/\s+/)

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
        return false
    }

    const actualBuffer = Buffer.from(token)
    const expectedBuffer = Buffer.from(expectedToken)

    return (
        actualBuffer.length === expectedBuffer.length &&
        timingSafeEqual(actualBuffer, expectedBuffer)
    )
}

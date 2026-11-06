export type CacheExpiryObservation = {
    tagExpiredAt: number | null
    entryMinusExpiryMs: number | null
}

// Preserve only numeric timing, never cache data, tags or an accessor error.
export function observeCacheExpiry(
    value: unknown,
    context: unknown,
    manifest: ReadonlyMap<string, { expired?: unknown }>
): CacheExpiryObservation {
    const empty: CacheExpiryObservation = {
        tagExpiredAt: null,
        entryMinusExpiryMs: null,
    }
    try {
        const ctx = context as {
            kind?: unknown
            tags?: unknown
            softTags?: unknown
        } | null
        if (ctx?.kind !== 'FETCH') return empty
        const tags = [
            ...(Array.isArray(ctx.tags) ? ctx.tags : []),
            ...(Array.isArray(ctx.softTags) ? ctx.softTags : []),
        ]
        let expiredAt: number | null = null
        for (const tag of tags) {
            if (typeof tag !== 'string') continue
            const expired = manifest.get(tag)?.expired
            if (typeof expired === 'number' && Number.isFinite(expired))
                expiredAt = Math.max(expiredAt ?? expired, expired)
        }
        const modified = (value as { lastModified?: unknown } | null)
            ?.lastModified
        const delta =
            expiredAt !== null &&
            typeof modified === 'number' &&
            Number.isFinite(modified)
                ? modified - expiredAt
                : null
        return {
            tagExpiredAt: expiredAt,
            entryMinusExpiryMs:
                delta !== null && Number.isFinite(delta) ? delta : null,
        }
    } catch {
        return empty
    }
}

type ContentSourceLogPayload = {
    area: 'detail' | 'index' | 'search'
    source: ContentSourceLogValue
    reason: string
    routePath?: string
    keyword?: string
    includeRemote?: boolean
    localCount?: number
    remoteCount?: number
    totalCount?: number
}

export type ContentSourceLogValue = 'local' | 'remote' | 'mixed' | 'none'

export function resolveCollectionContentSource(
    localCount: number,
    remoteCount: number
): ContentSourceLogValue {
    if (localCount > 0 && remoteCount > 0) {
        return 'mixed'
    }

    if (remoteCount > 0) {
        return 'remote'
    }

    if (localCount > 0) {
        return 'local'
    }

    return 'none'
}

export function logContentSource(payload: ContentSourceLogPayload) {
    console.info('[docs.content_source]', payload)
}

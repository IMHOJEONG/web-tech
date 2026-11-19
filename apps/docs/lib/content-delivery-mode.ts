type ContentEnvironment = Record<string, string | undefined>

export function getContentDeliveryMode(
    env: ContentEnvironment = {
        DOCS_CONTENT_SOURCE: process.env.DOCS_CONTENT_SOURCE,
    }
) {
    const mode = env.DOCS_CONTENT_SOURCE?.trim() || 'legacy'
    if (mode !== 'legacy' && mode !== 'private-git') {
        throw new Error('Invalid DOCS_CONTENT_SOURCE')
    }
    return mode
}

export function getPrivateContentRevision(
    env: ContentEnvironment = {
        DOCS_CONTENT_SOURCE: process.env.DOCS_CONTENT_SOURCE,
        DOCS_PRIVATE_CONTENT_REVISION:
            process.env.DOCS_PRIVATE_CONTENT_REVISION,
    }
) {
    if (getContentDeliveryMode(env) !== 'private-git') return undefined
    const revision = env.DOCS_PRIVATE_CONTENT_REVISION
    if (!revision || !/^[a-f0-9]{40}$/.test(revision)) {
        throw new Error('A prepared private content revision is required')
    }
    return revision
}

import { normalizeDocPath } from './normalize-doc-path.ts'

type DocRouteSource = {
    slug?: string | null
    markdownPath?: string | null
    fileName?: string | null
    path?: string | null
}

const CHANNEL_PREFIXES = ['feed/', 'web/', 'mobile/', 'ui-ux/'] as const

function normalizeRouteValue(value?: string | null) {
    if (typeof value !== 'string') {
        return null
    }

    const normalized = normalizeDocPath(value)
        .replace(/\.(mdx|md|html)$/i, '')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')
        .trim()

    return normalized || null
}

function collapseTrailingDuplicateLeaf(path: string) {
    const segments = path.split('/').filter(Boolean)

    if (segments.length < 2) {
        return path
    }

    const lastSegment = segments.at(-1)
    const previousSegment = segments.at(-2)

    if (lastSegment && previousSegment && lastSegment === previousSegment) {
        return segments.slice(0, -1).join('/')
    }

    return path
}

function normalizeStructuredRoutePath(path: string) {
    return collapseTrailingDuplicateLeaf(path)
}

export function normalizeRequestedDocRoutePath(value?: string | null) {
    const normalizedValue = normalizeRouteValue(value)

    if (!normalizedValue) {
        return null
    }

    return normalizeStructuredRoutePath(normalizedValue)
}

function mapLocalDataPathToRoute(path: string) {
    if (path.startsWith('data/v8/')) {
        return `web/${path.slice('data/v8/'.length)}`
    }

    if (path.startsWith('data/shadcn/')) {
        return `ui-ux/${path.slice('data/shadcn/'.length)}`
    }

    return null
}

function getStructuredRoutePath(source: DocRouteSource) {
    const candidates = [source.markdownPath, source.fileName, source.path]

    for (const candidate of candidates) {
        const normalized = normalizeRouteValue(candidate)

        if (!normalized || normalized.startsWith('category/')) {
            continue
        }

        const mappedLocalPath = mapLocalDataPathToRoute(normalized)

        if (mappedLocalPath) {
            return normalizeStructuredRoutePath(mappedLocalPath)
        }

        if (CHANNEL_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
            return normalizeStructuredRoutePath(normalized)
        }
    }

    return null
}

function getDocRouteAliases(source: DocRouteSource) {
    const aliases = new Set<string>()
    const candidates = [
        source.slug,
        source.markdownPath,
        source.fileName,
        source.path,
    ]

    for (const candidate of candidates) {
        const normalizedCandidate = normalizeRequestedDocRoutePath(candidate)

        if (normalizedCandidate) {
            aliases.add(normalizedCandidate)
        }
    }

    const structuredRoutePath = getStructuredRoutePath(source)

    if (structuredRoutePath) {
        aliases.add(structuredRoutePath)
    }

    return aliases
}

export function getDocRoutePath(source: DocRouteSource) {
    const structuredRoutePath = getStructuredRoutePath(source)

    if (structuredRoutePath) {
        return structuredRoutePath
    }

    return normalizeRouteValue(source.slug)
}

export function getDocHref(source: DocRouteSource) {
    const routePath = getDocRoutePath(source)

    return routePath ? `/docs/${routePath}` : '/docs'
}

export function shouldRedirectToCanonicalDocRoute(
    source: DocRouteSource,
    requestedRoutePath: string
) {
    const normalizedRequestedRoutePath = normalizeRouteValue(requestedRoutePath)
    const canonicalRoutePath = getDocRoutePath(source)

    if (!normalizedRequestedRoutePath || !canonicalRoutePath) {
        return false
    }

    return normalizedRequestedRoutePath !== canonicalRoutePath
}

export function isDocRouteMatch(source: DocRouteSource, routePath: string) {
    const normalizedRoutePath = normalizeRequestedDocRoutePath(routePath)

    if (!normalizedRoutePath) {
        return false
    }

    return getDocRouteAliases(source).has(normalizedRoutePath)
}
